# Bayora Secure AI Safety Infrastructure — System Specification (Hardened Architecture)

## 1. Executive Summary & Context

Bayora is an adversarial AI safety validation platform designed around an automated red-team/blue-team dynamic. The **Red Team service** generates adversarial inputs (jailbreaks, prompt injections, and safety boundary probes); the **Blue Team service** applies input defense guardrails and classifiers; the **Model Runner service** hosts the language model under test; the **Evaluation Scorer service** grades model outputs; and the **Ledger service** cryptographically records all transactions.

All service mediation is orchestrated through a central **Blind Isolation Broker**, which serves as the **Trusted Computing Base (TCB)** for the infrastructure.

This specification addresses the structural vulnerabilities of shared container environments by applying strict Docker network micro-segmentation, defense-in-depth container hardening, constant-window timing normalization, an isolated append-only signed audit ledger, and explicit model state lifecycle governance.

---

## 2. Threat Model & Security Boundaries

### Mitigated Under Stated Assumptions
1. **Direct Cross-Tenant Network Snooping:** Mitigated by assigning each tenant an isolated `internal: true` Docker network with host IP forwarding disabled.
2. **Defensive Rule Inference via Timing:** Mitigated by enforcing a deterministic, fixed response time window ($T_{\text{window}}$) with identical byte-padded refusal payloads for all rejection states (BLOCK, model refusal, and timeout).
3. **Pre-Evaluation Payload Snooping:** Mitigated by the Broker acting as a blind gateway, routing payloads to Blue for runtime classification without prior visibility or persistent caching.
4. **Context & KV-Cache Bleed:** Mitigated by model-runner self-purging and disabling inference prefix caching prior to processing each turn.
5. **Post-Hoc Audit Manipulation & Truncation:** Mitigated by HMAC-signing each ledger entry with a secret key held exclusively by the isolated Ledger service, while maintaining the head hash and entry count on an external host path.
6. **Configuration & Ruleset Drift:** Mitigated by mounting Blue rulesets read-only and hashing them at startup alongside container image digests and model weights into the genesis audit record.
7. **Single-Turn Stateless Scope:** The testing environment strictly evaluates single-turn adversarial prompts. Multi-turn conversational attacks are explicitly defined as out of scope for this architecture (or must be evaluated via deterministic session replay).

### Residual Risks & Out-of-Scope Conditions
1. **Broker Compromise (TCB Vulnerability):** Because the Broker is the multi-homed orchestrator and single point of mediation, a vulnerability inside the Broker code compromises isolation across networks.
2. **Micro-Architectural Side Channels:** Shared bare-metal CPU cores remain susceptible to low-level hardware cache attacks (such as Spectre, Meltdown, or memory bus timing). Complete mitigation requires dedicated physical hardware or strict CPU core-pinning.
3. **ALLOW/BLOCK Oracle Probing:** Even with standardized refusals and timing normalization, an adversary with an unlimited query budget can systematically test attack variations to map classifier boundaries. Mitigated via a per-client token bucket query budget.
4. **Host Kernel Zero-Day Exploits:** Kernel-level privilege escalations bypassing Docker seccomp and namespaces remain an unmitigated host risk.

---

## 3. Network Architecture & Inter-Component Authentication

The system uses a strict hub-and-spoke network topology. All four periphery services reside on separate Docker bridge networks marked with `internal: true` (disabling external gateway routing). Host IP forwarding is disabled.

The **Broker** is the only service attached to all four networks.

```
+-------------------------------------------------------------------------------+
|                             DOCKER HOST                                       |
|                                                                               |
|  [ red_team ]               [ blue_team ]            [ model_runner ]         |
|        │                          │                         │                 |
|   (net_red)                  (net_blue)                (net_model)            |
|  internal: true             internal: true            internal: true          |
|        │                          │                         │                 |
|        └───────────────────┐      │      ┌──────────────────┘                 |
|                            ▼      ▼      ▼                                    |
|                       [ broker (Gateway / TCB) ]                              |
|                                   │                                           |
|                              (net_ledger)                                     |
|                             internal: true                                    |
|                                   │                                           |
|                                   ▼                                           |
|                               [ ledger ] ──> [ eval_scorer ]                  |
|                               (Keyed HMAC)   (Output Safety)                  |
+-------------------------------------------------------------------------------+
```

### Network Definitions
- **`net_red`**: Connects `red_team` $\leftrightarrow$ `broker`. No access to Blue, Model, or Ledger.
- **`net_blue`**: Connects `blue_team` $\leftrightarrow$ `broker`. No access to Red, Model, or Ledger.
- **`net_model`**: Connects `model_runner`, `eval_scorer` $\leftrightarrow$ `broker`.
- **`net_ledger`**: Connects `ledger` $\leftrightarrow$ `broker`. Strictly reachable only by the Broker.

### Inter-Component Authentication
All internal HTTP communications utilize per-hop pre-shared Bearer tokens loaded through environment variables at startup:
- `AUTH_TOKEN_RED_BROKER`
- `AUTH_TOKEN_BROKER_BLUE`
- `AUTH_TOKEN_BROKER_MODEL`
- `AUTH_TOKEN_BROKER_LEDGER`

---

## 4. Container Hardening & Least-Privilege Baseline

Every container in the composition enforces the following hardening flags:

| Hardening Control | Docker Compose Directive | Security Rationale |
|---|---|---|
| **Non-Root Execution** | `user: "10001:10001"` | Prevents root-level host mapping upon breakout. |
| **Read-Only Root Filesystem** | `read_only: true` | Prevents writing malware, modifying configs, or touching system binaries. |
| **Privilege Escalation Block** | `security_opt: ["no-new-privileges:true"]` | Blocks `setuid`/`setgid` binary exploitation. |
| **Ephemeral Writable Storage** | `tmpfs: ["/tmp:size=64M,noexec,nosuid,nodev"]` | Provides RAM-only scratch space; prevents executable drops. |
| **Resource Quotas** | `pids_limit: 100`, `mem_limit: 1g`, `cpus: 1.0` | Prevents denial-of-service and thread exhaustion attacks. |
| **No Docker Socket Access** | `/var/run/docker.sock` explicitly excluded | Prevents root takeover of the Docker daemon. |
| **No Cross-Container Mounts** | Zero shared host volumes | Eliminates cross-tenant file inspection or race conditions. |
| **Supply Chain Anchoring** | Pinned image digests (`image@sha256:...`) | Guarantees container runtime reproducibility. |

---

## 5. End-to-End Workflow & Timing Normalization

```
1. Red Team Submits Payload (AdvBench / HarmBench)
   │
   ▼
2. Broker Ingestion (T_start recorded)
   │
   ├── Authenticates Red Token & checks Client Query Budget
   ├── Generates unique Turn UUID
   │
   ▼
3. Defensive Inspection
   │
   ├── Broker forwards payload to Blue Team over net_blue
   └── Blue Team evaluates against static ruleset & returns ALLOW or BLOCK
       (Model receives original raw prompt if ALLOW; Blue never rewrites payload)
   │
   ▼
4. Model Processing (If ALLOW)
   │
   ├── Broker dispatches payload to Model Runner over net_model
   ├── Model Runner self-purges KV-cache, processes prompt, returns response
   └── Evaluation Scorer evaluates model output for safety compliance (Safe / Unsafe)
   │
   ▼
5. Audit Record Generation (Fail-Closed)
   │
   ├── Broker packages event: {UUID, Timestamp, PayloadHash, Status, OutputHash, Score}
   ├── Broker calls Ledger over net_ledger to append signed entry
   └── IF Ledger fails: Entire transaction aborts immediately (Fail-Closed)
   │
   ▼
6. Timing Normalization & Response
   │
   ├── Broker calculates elapsed time Δt = T_current - T_start
   ├── If Δt < T_window: Broker sleeps for (T_window - Δt)
   └── Returns standardized response:
       - ALLOW: { status: "SUCCESS", completion: "..." }
       - BLOCK / REFUSAL / TIMEOUT: Returns byte-identical refusal payload:
         { status: "REJECTED", reason: "SYSTEM_SECURITY_REFUSAL" } (Padded to 128 bytes)
```

### Deterministic Timing Defense
To prevent timing-based classifier discovery, the Broker enforces a **Strict Response Window** of $T_{\text{window}} = 1500\text{ ms}$:
- If Blue blocks in 20 ms, the Broker waits until 1500 ms to return the refusal.
- If the Model completes in 900 ms, the Broker waits until 1500 ms.
- If processing exceeds 1500 ms, a `TIMEOUT` triggers, returning the standard refusal at the boundary.
- Payloads for `BLOCK`, `MODEL_REFUSAL`, and `TIMEOUT` are padded to an identical 128-byte size to neutralize packet-size side channels.

---

## 6. Model State Lifecycle & Cache Governance

To address LLM-native context leaks:
1. **Self-Purge Ownership:** The Model Runner service owns context purging. Immediately before accepting and executing a new prompt, its internal execution loop clears its context array and resets the engine session.
2. **Prefix Caching Disabled:** The inference engine runs with prompt prefix caching explicitly disabled (e.g. `--disable-prefix-caching`), preventing shared token trees across calls.
3. **Stateless Turn Context:** Each request contains exclusively the single test prompt. Conversation history arrays are never preserved across calls.

---

## 7. Output Scoring (Closing the Safety Loop)

To compute empirical Attack Success Rates (ASR) and safety benchmarks:
1. When an adversarial prompt is permitted by Blue (`ALLOW`) and executed by the Model Runner, the completion is routed to the **Evaluation Scorer** service.
2. The Scorer uses an automated evaluation classifier to determine whether the completion fulfilled the harmful intent (`UNSAFE_COMPLETION`) or adhered to refusal boundaries (`SAFE_COMPLETION`).
3. The evaluation verdict is passed back to the Broker and cryptographically committed into the Ledger alongside the prompt hash.

---

## 8. Cryptographic Tamper-Proof & Truncation-Resistant Ledger

The Ledger runs as an isolated microservice on `net_ledger` with its own private Docker volume.

```
Block 0 (Genesis):
  HMAC-SHA256 (
    Key,
    Index: 0 ||
    Timestamp ||
    BlueRulesetHash ||
    ModelWeightsHash ||
    ImageDigestsHash
  )

Block N:
  HMAC-SHA256 (
    Key,
    Index: N ||
    Previous_HMAC ||
    Timestamp ||
    TurnUUID ||
    PayloadHash ||
    Decision (ALLOW/BLOCK/TIMEOUT/ERROR) ||
    Score (SAFE/UNSAFE/N/A)
  )
```

### Security Properties
1. **Key Isolation:** The HMAC secret key resides exclusively in the `ledger` service environment (injected via secret). Even if an attacker compromises the Red, Blue, or Broker containers, they cannot compute valid signatures to rewrite past records.
2. **Truncation & Deletion Protection:** The Ledger writes the current `(Head_Hash, Total_Count)` to an external state mount accessible only in read-only mode by verification tools. A log truncated from 100 entries to 50 will trigger an immediate count mismatch error.
3. **Fail-Closed Guarantee:** If the Ledger service is unresponsive or the disk is full, the Broker terminates the evaluation loop immediately. No model inference is released without a verified audit receipt.
4. **Comprehensive Logging:** All execution paths—`ALLOW`, `BLOCK`, `TIMEOUT`, and `INTERNAL_ERROR`—are committed to the ledger.

---

## 9. Docker Compose Specification (`docker-compose.yml`)

```yaml
version: "3.8"

networks:
  net_red:
    internal: true
  net_blue:
    internal: true
  net_model:
    internal: true
  net_ledger:
    internal: true

services:
  broker:
    image: bayora/broker:latest@sha256:d8a7c2e1b4f3a...
    container_name: bayora-broker
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64M,noexec,nosuid,nodev
    environment:
      - AUTH_TOKEN_RED=token_red_secret_123
      - AUTH_TOKEN_BLUE=token_blue_secret_456
      - AUTH_TOKEN_MODEL=token_model_secret_789
      - AUTH_TOKEN_LEDGER=token_ledger_secret_012
      - RESPONSE_WINDOW_MS=1500
      - CLIENT_QUERY_LIMIT=100
    networks:
      - net_red
      - net_blue
      - net_model
      - net_ledger
    pids_limit: 100
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  red_team:
    image: bayora/red-team:latest@sha256:e4b2c1a8f9d0...
    container_name: bayora-red-team
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64M,noexec,nosuid,nodev
    environment:
      - BROKER_URL=http://broker:8000
      - AUTH_TOKEN=token_red_secret_123
    networks:
      - net_red
    pids_limit: 50
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  blue_team:
    image: bayora/blue-team:latest@sha256:f1c3b4a2d8e9...
    container_name: bayora-blue-team
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64M,noexec,nosuid,nodev
    volumes:
      - ./rules/guardrails.json:/app/rules/guardrails.json:ro
    environment:
      - AUTH_TOKEN=token_blue_secret_456
    networks:
      - net_blue
    pids_limit: 50
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  model_runner:
    image: bayora/model-runner:latest@sha256:a2d9c4e8b7f1...
    container_name: bayora-model-runner
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=128M,noexec,nosuid,nodev
    environment:
      - AUTH_TOKEN=token_model_secret_789
      - DISABLE_PREFIX_CACHE=true
    networks:
      - net_model
    pids_limit: 100
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2048M

  eval_scorer:
    image: bayora/eval-scorer:latest@sha256:b5c7d8e2a1f4...
    container_name: bayora-eval-scorer
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64M,noexec,nosuid,nodev
    environment:
      - AUTH_TOKEN=token_model_secret_789
    networks:
      - net_model
    pids_limit: 50

  ledger:
    image: bayora/ledger:latest@sha256:c9e1d4b8a7f2...
    container_name: bayora-ledger
    user: "10001:10001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64M,noexec,nosuid,nodev
    volumes:
      - ledger_data:/var/log/bayora_audit
    environment:
      - AUTH_TOKEN=token_ledger_secret_012
      - HMAC_SECRET_KEY=ledger_isolated_key_999888
    networks:
      - net_ledger
    pids_limit: 50

volumes:
  ledger_data:
    driver: local
```

---

## 10. Project Directory Layout

```
bayora-secure-sandbox/
├── docker-compose.yml              # Complete hardened compose configuration
├── broker/
│   ├── app.py                      # TCB gateway, timing padding, rate limiter
│   └── requirements.txt
├── red_team/
│   ├── attack_runner.py            # AdvBench / HarmBench payload dispatcher
│   └── Dockerfile
├── blue_team/
│   ├── rules/
│   │   └── guardrails.json         # Static read-only defense rules
│   ├── guardrail_service.py        # ALLOW/BLOCK inspection endpoint
│   └── Dockerfile
├── model_runner/
│   ├── inference_service.py        # Stateless runner with self-purge routine
│   └── Dockerfile
├── eval_scorer/
│   ├── score_service.py            # Automated output safety classification
│   └── Dockerfile
├── ledger/
│   ├── ledger_service.py           # HMAC-SHA256 append-only service
│   ├── verify.py                   # Integrity & truncation verification utility
│   └── Dockerfile
└── docs/
    └── THREAT_MODEL.md             # Formal security boundaries and residual risks
```
