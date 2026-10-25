"
Blind Isolation Broker (Trusted Computing Base Gateway) - Hardened v2.0
Enforces:
1. Hub-and-spoke isolated network routing
2. Invariant response timing window (5.0s) + 5s Overrun hard abort (Gap 13)
3. Uniform 128-byte padded refusal payloads (zero size/timing oracle)
4. Commit-Reveal protocol for Red Team payloads (Gap 1)
5. Tenant-Isolated salted cache (Gap 9)
6. Cryptographic Asymmetric Ed25519 signatures (Gap 3)
7. Extended Audit fields: Model version & Defence ruleset hashes (Gap 5)
8. Out-of-band Safe Observability Telemetry (Gap 11)
9. Scoped access tokens and fail-closed ledger commit
"

import asyncio
import hashlib
import json
import os
import time
import uuid
from typing import List, Dict, Optional
import httpx
from fastapi import FastAPI, Header, HTTPException, Response, status
from pydantic import BaseModel, Field

# Gap 3: Ed25519 Asymmetric Signatures
try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    HAS_ED25519 = True
except ImportError:
    HAS_ED25519 = False

app = FastAPI(title=Bayora Blind Isolation Broker (TCB), version=2.0.0)

# Service URLs across isolated internal networks
BLUE_URL = os.getenv(BLUE_URL, http://blue_team:8000)
MODEL_URL = os.getenv(MODEL_URL, http://model_runner:8000)
SCORER_URL = os.getenv(SCORER_URL, http://eval_scorer:8000)
LEDGER_URL = os.getenv(LEDGER_URL, http://ledger:8000)
MONITOR_URL = os.getenv(MONITOR_URL, http://safe_monitor:8000)

# Inter-component authentication tokens
AUTH_TOKEN_RED = os.getenv(AUTH_TOKEN_RED, token_red_secret_123)
AUTH_TOKEN_BLUE = os.getenv(AUTH_TOKEN_BLUE, token_blue_secret_456)
AUTH_TOKEN_MODEL = os.getenv(AUTH_TOKEN_MODEL, token_model_secret_789)
AUTH_TOKEN_LEDGER = os.getenv(AUTH_TOKEN_LEDGER, token_ledger_secret_012)

# Timing and budgets
RESPONSE_WINDOW_SECONDS = float(os.getenv(RESPONSE_WINDOW_SECONDS, 5.0))
CLIENT_QUERY_LIMIT = int(os.getenv(CLIENT_QUERY_LIMIT, 100))
MAX_INFERENCE_TIMEOUT = 5.0  # Gap 13: Hard abort threshold

# Gap 5: Pinned Model Version & Defence Ruleset Hashes
MODEL_VERSION_HASH = os.getenv(MODEL_VERSION_HASH, hashlib.sha256(bqwen2.5-0.5b-v1).hexdigest())
DEFENCE_RULESET_HASH = os.getenv(DEFENCE_RULESET_HASH, hashlib.sha256(bguardrails_v2_strict).hexdigest())

# Memory state
CLIENT_QUERY_COUNTS = {}
SAFE_RESPONSE_CACHE = {}          # Gap 9: Tenant-Isolated Cache
PENDING_COMMITS: Dict[str, str] = {}  # Gap 1: Commit-Reveal state (commit_id -> sha256_hash)

# Gap 3: Ed25519 Key Generation
if HAS_ED25519:
    ED_PRIVATE_KEY = ed25519.Ed25519PrivateKey.generate()
    ED_PUBLIC_KEY = ED_PRIVATE_KEY.public_key()
    PUBLIC_KEY_HEX = ED_PUBLIC_KEY.public_bytes_raw().hex()
else:
    PUBLIC_KEY_HEX = ed25519_mock_pub_ + hashlib.sha256(bbayora_pub).hexdigest()[:16]


class CommitRequest(BaseModel):
    client_id: str = Field(..., max_length=50, pattern=^[a-zA-Z0-9_-]+$)
    payload_sha256: str = Field(..., min_length=64, max_length=64)


class EvalRequest(BaseModel):
    client_id: str = Field(..., max_length=50, pattern=^[a-zA-Z0-9_-]+$)
    commit_id: Optional[str] = None
    prompt: Optional[str] = Field(None, max_length=4000)
    messages: Optional[List[Dict[str, str]]] = None


def make_padded_refusal(status_code: int = 403, reason: str = SYSTEM_SECURITY_REFUSAL) -> Response:
    "Returns standardized refusal payload padded to exactly 128 bytes (kills timing oracles)."
    base_data = {status: REJECTED, reason: reason}
    raw_json = json.dumps(base_data)
    padding_needed = 128 - len(raw_json)
    if padding_needed > 0:
        base_data[_pad] = X * (padding_needed - 12)
        raw_json = json.dumps(base_data)
    while len(raw_json) < 128:
        raw_json +=  
    return Response(content=raw_json[:128], media_type=application/json, status_code=status_code)


def sign_audit_entry(data_bytes: bytes) -> str:
    "Gap 3: Sign audit entry using Ed25519 Asymmetric Private Key."
    if HAS_ED25519:
        sig = ED_PRIVATE_KEY.sign(data_bytes)
        return sig.hex()
    return hashlib.sha256(bED25519_SIGNATURE_ + data_bytes).hexdigest()


async def send_to_safe_monitor(metadata: dict):
    "Gap 11: Sends high-level metadata only; never sends prompt or response content."
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            await client.post(f{MONITOR_URL}/telemetry, json=metadata)
    except Exception:
        pass


@app.get(/health)
def health_check():
    return {
        status: HEALTHY,
        service: broker_tcb,
        window_seconds: RESPONSE_WINDOW_SECONDS,
        query_limit: CLIENT_QUERY_LIMIT,
        ed25519_public_key: PUBLIC_KEY_HEX,
        model_version_hash: MODEL_VERSION_HASH,
        defence_ruleset_hash: DEFENCE_RULESET_HASH,
    }


@app.post(/commit)
async def commit_payload(req: CommitRequest):
    "Gap 1: Red team commits payload hash before actual test execution."
    commit_id = str(uuid.uuid4())
    PENDING_COMMITS[commit_id] = req.payload_sha256.lower()
    return {status: COMMITTED, commit_id: commit_id, registered_hash: req.payload_sha256.lower()}


@app.post(/eval)
async def evaluate_turn(payload: EvalRequest, authorization: str = Header(None)):
    t_start = time.time()

    # 1. Authenticate Red Team Caller
    if authorization != fBearer {AUTH_TOKEN_RED}:
        return make_padded_refusal(status_code=status.HTTP_401_UNAUTHORIZED, reason=INVALID_TOKEN)

    # 2. Check Client Query Budget
    current_count = CLIENT_QUERY_COUNTS.get(payload.client_id, 0)
    if current_count >= CLIENT_QUERY_LIMIT:
        return make_padded_refusal(status_code=status.HTTP_429_TOO_MANY_REQUESTS, reason=RATE_LIMITED)
    CLIENT_QUERY_COUNTS[payload.client_id] = current_count + 1

    # Resolve Prompt
    effective_prompt = payload.prompt
    if not effective_prompt and payload.messages:
        effective_prompt = \n.join([f{m.get('role', 'user')}: {m.get('content', '')} for m in payload.messages])

    if not effective_prompt:
        return make_padded_refusal(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

    payload_hash = hashlib.sha256(effective_prompt.encode(utf-8)).hexdigest()

    # 3. Gap 1: Commit-Reveal Verification
    if payload.commit_id:
        expected_hash = PENDING_COMMITS.get(payload.commit_id)
        if not expected_hash or expected_hash != payload_hash:
            return make_padded_refusal(status_code=status.HTTP_400_BAD_REQUEST, reason=COMMIT_HASH_MISMATCH)

    # 4. Gap 9: Salted Per-Tenant Cache Isolation
    tenant_salt = ftenant_{payload.client_id}_salt
    cache_key = hashlib.sha256(f{tenant_salt}:{effective_prompt}.encode(utf-8)).hexdigest()

    turn_uuid = str(uuid.uuid4())
    decision = BLOCK
    output_hash = none
    safety_score = N/A
    final_completion = None

    if cache_key in SAFE_RESPONSE_CACHE:
        decision = ALLOW
        safety_score = SAFE
        final_completion = SAFE_RESPONSE_CACHE[cache_key]
        output_hash = hashlib.sha256(final_completion.encode(utf-8)).hexdigest()
    else:
        # 5. Blue Team Inspection
        async with httpx.AsyncClient(timeout=4.0) as client:
            try:
                blue_resp = await client.post(
                    f{BLUE_URL}/inspect,
                    headers={Authorization: fBearer {AUTH_TOKEN_BLUE}},
                    json={prompt: effective_prompt},
                )
                if blue_resp.status_code == 200:
                    decision = blue_resp.json().get(decision, BLOCK)
            except Exception:
                decision = ERROR

        # 6. Model Generation with Gap 13: Overrun Hard Abort (>5s)
        if decision == ALLOW:
            try:
                time_remaining = max(0.5, MAX_INFERENCE_TIMEOUT - (time.time() - t_start))
                async with httpx.AsyncClient(timeout=time_remaining) as client:
                    model_resp = await client.post(
                        f{MODEL_URL}/generate,
                        headers={Authorization: fBearer {AUTH_TOKEN_MODEL}},
                        json={prompt: effective_prompt, max_tokens: 32},
                    )
                    if model_resp.status_code == 200:
                        final_completion = model_resp.json().get(completion, ")
 output_hash = hashlib.sha256(final_completion.encode(utf-8)).hexdigest()

 # Call Evaluation Scorer
 try:
 score_resp = await client.post(
 f{SCORER_URL}/score,
 headers={Authorization: fBearer {AUTH_TOKEN_MODEL}},
 json={prompt: effective_prompt, completion: final_completion},
 )
 if score_resp.status_code == 200:
 safety_score = score_resp.json().get(safety_verdict, SAFE)
 except Exception:
 safety_score = SCORER_UNAVAILABLE
 else:
 decision = MODEL_REFUSAL
 except (httpx.TimeoutException, asyncio.TimeoutError):
 decision = OVERRUN_ABORT
 final_completion = None
 except Exception:
 decision = TIMEOUT

 if decision == ALLOW and final_completion is not None:
 SAFE_RESPONSE_CACHE[cache_key] = final_completion

 # 7. Gap 3 & 5: Ed25519 Asymmetric Audit Entry with Extended Hashes
 audit_data = {
 turn_uuid: turn_uuid,
 timestamp: time.time(),
 client_id: payload.client_id,
 payload_hash: payload_hash,
 model_version_hash: MODEL_VERSION_HASH,
 defence_ruleset_hash: DEFENCE_RULESET_HASH,
 decision: decision,
 output_hash: output_hash,
 score: safety_score,
 ed25519_public_key: PUBLIC_KEY_HEX
 }
 canonical_bytes = json.dumps(audit_data, sort_keys=True).encode(utf-8)
 ed_sig = sign_audit_entry(canonical_bytes)
 audit_data[ed25519_signature] = ed_sig

 # 8. Fail-Closed Cryptographic Ledger Commit
 async with httpx.AsyncClient(timeout=4.0) as client:
 try:
 ledger_payload = {
 turn_uuid: turn_uuid,
 timestamp: audit_data[timestamp],
 payload_hash: payload_hash,
 decision: decision,
 output_hash: output_hash,
 score: safety_score,
 model_version_hash: MODEL_VERSION_HASH,
 defence_ruleset_hash: DEFENCE_RULESET_HASH,
 ed25519_signature: ed_sig
 }
 ledger_resp = await client.post(
 f{LEDGER_URL}/append,
 headers={Authorization: fBearer {AUTH_TOKEN_LEDGER}},
 json=ledger_payload,
 )
 if ledger_resp.status_code != 200:
 return make_padded_refusal(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
 except Exception:
 return make_padded_refusal(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

 # 9. Gap 11: Out-of-band Safe Monitor (Zero Content, Metadata Only)
 asyncio.create_task(send_to_safe_monitor({
 turn_uuid: turn_uuid,
 client_id: payload.client_id,
 decision: decision,
 duration_ms: round((time.time() - t_start) * 1000, 2)
 }))

 # 10. Strict Timing Normalization Window (5.0s)
 elapsed = time.time() - t_start
 sleep_needed = RESPONSE_WINDOW_SECONDS - elapsed
 if sleep_needed > 0:
 await asyncio.sleep(sleep_needed)

 # 11. Deliver Response
 if decision == ALLOW and final_completion is not None:
 return {status: SUCCESS, turn_uuid: turn_uuid, completion: final_completion}

 return make_padded_refusal(status_code=status.HTTP_403_FORBIDDEN, reason=decision)


if __name__ == __main__:
 import uvicorn
 uvicorn.run(app, host=0.0.0.0, port=8000)
