"
Isolated Cryptographic Ledger Microservice - Hardened v2.0
Appends evaluation records to a tamper-evident, HMAC-SHA256 authenticated hash chain
with Ed25519 asymmetric signatures and Model/Defence ruleset hashes.
"

import hashlib
import hmac
import json
import os
import time
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel

app = FastAPI(title=Bayora Cryptographic Audit Ledger, version=2.0.0)

LOG_DIR = os.getenv(LOG_DIR_PATH, /var/log/bayora_audit)
os.makedirs(LOG_DIR, exist_ok=True)

LEDGER_FILE = os.path.join(LOG_DIR, ledger.jsonl)
HEAD_HASH_FILE = os.path.join(LOG_DIR, head_hash.txt)
COUNT_FILE = os.path.join(LOG_DIR, total_entries.txt)

AUTH_TOKEN = os.getenv(AUTH_TOKEN, token_ledger_secret_012)
HMAC_KEY = os.getenv(HMAC_SECRET_KEY, ledger_isolated_key_999888).encode(utf-8)


class AppendRequest(BaseModel):
    turn_uuid: str
    timestamp: float
    payload_hash: str
    decision: str
    output_hash: str = none
    score: str = N/A
    model_version_hash: str = none
    defence_ruleset_hash: str = none
    ed25519_signature: str = none


def compute_hmac(prev_hash: str, index: int, timestamp: float, data: str) -> str:
    message = f{index}|{prev_hash}|{timestamp:.4f}|{data}.encode(utf-8)
    return hmac.new(HMAC_KEY, message, hashlib.sha256).hexdigest()


def get_current_state():
    if not os.path.exists(LEDGER_FILE) or os.path.getsize(LEDGER_FILE) == 0:
        genesis_time = time.time()
        genesis_hash = compute_hmac(0 * 64, 0, genesis_time, GENESIS_BLOCK_CONFIG_PINNED)
        genesis_entry = {
            index: 0,
            prev_hash: 0 * 64,
            timestamp: genesis_time,
            turn_uuid: 00000000-0000-0000-0000-000000000000,
            payload_hash: genesis,
            decision: GENESIS,
            output_hash: genesis,
            score: GENESIS,
            model_version_hash: genesis_model_pinned,
            defence_ruleset_hash: genesis_ruleset_pinned,
            ed25519_signature: genesis_sig,
            entry_hmac: genesis_hash,
        }
        with open(LEDGER_FILE, w, encoding=utf-8) as f:
            f.write(json.dumps(genesis_entry) + \n)
        with open(HEAD_HASH_FILE, w, encoding=utf-8) as f:
            f.write(genesis_hash)
        with open(COUNT_FILE, w, encoding=utf-8) as f:
            f.write(1)
        return genesis_hash, 1

    with open(HEAD_HASH_FILE, r, encoding=utf-8) as f:
        head_hash = f.read().strip()
    with open(COUNT_FILE, r, encoding=utf-8) as f:
        count = int(f.read().strip())
    return head_hash, count


CURRENT_HEAD, CURRENT_COUNT = get_current_state()


@app.get(/health)
def health_check():
    head, count = get_current_state()
    return {status: HEALTHY, service: ledger, head_hash: head, total_blocks: count}


@app.post(/append)
def append_entry(entry: AppendRequest, authorization: str = Header(None)):
    expected_header = fBearer {AUTH_TOKEN}
    if authorization != expected_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=Invalid inter-component credentials)

    head, count = get_current_state()
    new_index = count
    data_str = f{entry.turn_uuid}|{entry.payload_hash}|{entry.decision}|{entry.output_hash}|{entry.score}|{entry.model_version_hash}|{entry.defence_ruleset_hash}
    new_hmac = compute_hmac(head, new_index, entry.timestamp, data_str)

    record = {
        index: new_index,
        prev_hash: head,
        timestamp: entry.timestamp,
        turn_uuid: entry.turn_uuid,
        payload_hash: entry.payload_hash,
        decision: entry.decision,
        output_hash: entry.output_hash,
        score: entry.score,
        model_version_hash: entry.model_version_hash,
        defence_ruleset_hash: entry.defence_ruleset_hash,
        ed25519_signature: entry.ed25519_signature,
        entry_hmac: new_hmac,
    }

    with open(LEDGER_FILE, a, encoding=utf-8) as f:
        f.write(json.dumps(record) + \n)

    with open(HEAD_HASH_FILE, w, encoding=utf-8) as f:
        f.write(new_hmac)

    with open(COUNT_FILE, w, encoding=utf-8) as f:
        f.write(str(new_index + 1))

    return {status: APPENDED, index: new_index, entry_hmac: new_hmac}


if __name__ == __main__:
    import uvicorn
    uvicorn.run(app, host=0.0.0.0, port=8000)
