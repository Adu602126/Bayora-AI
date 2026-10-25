# Bayora Tests — What We Test & How to Run

## Running the Full Suite

```bash
# Full test suite with detailed output
python -m pytest tests/test_guardrail_unit.py tests/test_bypass_attempts.py -v

# Quick summary (pass/fail count only)
python -m pytest tests/test_guardrail_unit.py tests/test_bypass_attempts.py -q

# Single file only
python -m pytest tests/test_guardrail_unit.py -v
python -m pytest tests/test_bypass_attempts.py -v
```

Expected output:
```
54 passed in ~22s
```

---

## Test Files Overview

### `test_guardrail_unit.py` — 37 Unit Tests

| Category | Tests | What It Checks |
|---|---|---|
| Benign Prompts | 8 | SHA-256, Docker, NIST, zero-day, OWASP, API security queries → all ALLOWED |
| Obvious Attacks | 10 | Direct hacking, exploit, ransomware, bomb-making keywords → all BLOCKED |
| Bypass Attempts | 10 | Obfuscated, indirect, and framed harmful prompts → all BLOCKED |
| HMAC Integrity | 4 | Ledger chain cryptographic validity after decisions |
| Timing Tests | 5 | Constant-time response verification (side-channel resistance) |

### `test_bypass_attempts.py` — 17 Adversarial Tests

| Category | Tests | What It Checks |
|---|---|---|
| Paraphrase Attacks | 3 | Reworded harmful intent (no keywords) → caught by Neural Transformer |
| Leetspeak | 2 | Character substitution (`h4ck`, `3xpl01t`) → caught by Keyword/Heuristic |
| Persona Jailbreaks | 3 | "Act as DAN", "Ignore previous instructions" → caught by Heuristic Layer |
| Context Framing | 2 | "For my novel...", "Hypothetically..." → caught by ML Semantic Layer |
| False Positive Prevention | 4 | Legitimate security/safety queries → all correctly ALLOWED |
| Summary Report | 3 | Overall bypass detection rate validation (must be 12/12 = 100%) |

---

## What Makes These Tests Meaningful

Standard hackathon projects test with simple keyword matches. Bayora's tests go further:

1. **Paraphrase test** — verifies the Neural Transformer catches intent even when the attacker avoids all blocked keywords entirely.

2. **False positive tests** — verifies the system doesn't accidentally block legitimate security research queries (SHA-256 hashing, Docker namespaces, NIST framework, API security).

3. **HMAC integrity test** — verifies the cryptographic audit ledger is intact after a batch of 10+ inspections.

4. **Timing test** — verifies ALLOW and BLOCK responses take comparable time (prevents a timing side-channel that could reveal filter logic).
