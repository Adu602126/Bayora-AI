"""
Independent Audit Ledger Verifier CLI
Recomputes cryptographic HMAC-SHA256 signatures sequentially.
Validates sequence integrity and flags truncation or tampering attempts.
"""

import hashlib
import hmac
import json
import os
import sys

LOG_DIR = os.getenv("LOG_DIR_PATH", "/var/log/bayora_audit")
LEDGER_FILE = os.path.join(LOG_DIR, "ledger.jsonl")
COUNT_FILE = os.path.join(LOG_DIR, "total_entries.txt")
HEAD_HASH_FILE = os.path.join(LOG_DIR, "head_hash.txt")
HMAC_KEY = os.getenv("HMAC_SECRET_KEY", "ledger_isolated_key_999888").encode("utf-8")


def compute_hmac(prev_hash: str, index: int, timestamp: float, data: str) -> str:
    message = f"{index}|{prev_hash}|{timestamp:.4f}|{data}".encode("utf-8")
    return hmac.new(HMAC_KEY, message, hashlib.sha256).hexdigest()


def verify_ledger():
    if not os.path.exists(LEDGER_FILE):
        print("[ERROR] Ledger file not found.")
        sys.exit(1)

    with open(LEDGER_FILE, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    if not lines:
        print("[ERROR] Ledger is empty.")
        sys.exit(1)

    expected_count = None
    if os.path.exists(COUNT_FILE):
        with open(COUNT_FILE, "r", encoding="utf-8") as f:
            expected_count = int(f.read().strip())

    if expected_count is not None and len(lines) != expected_count:
        print(f"[TAMPER DETECTED] Truncation or deletion attack! Expected {expected_count} blocks, found {len(lines)}.")
        sys.exit(1)

    prev_hash = "0" * 64
    for idx, line in enumerate(lines):
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            print(f"[TAMPER DETECTED] Malformed JSON at Block #{idx}.")
            sys.exit(1)

        if record["index"] != idx:
            print(f"[TAMPER DETECTED] Sequence break! Block index {record['index']} != expected {idx}.")
            sys.exit(1)

        if idx == 0:
            recomputed = compute_hmac("0" * 64, 0, record["timestamp"], "GENESIS_BLOCK_CONFIG_PINNED")
        else:
            data_str = f"{record['turn_uuid']}|{record['payload_hash']}|{record['decision']}|{record['output_hash']}|{record['score']}"
            recomputed = compute_hmac(prev_hash, idx, record["timestamp"], data_str)

        if record["entry_hmac"] != recomputed:
            print(f"[TAMPER DETECTED] Signature mismatch at Block #{idx}!")
            print(f"  Recorded HMAC  : {record['entry_hmac']}")
            print(f"  Recomputed HMAC: {recomputed}")
            sys.exit(1)

        prev_hash = recomputed

    print(f"[AUDIT VERIFIED] All {len(lines)} blocks are mathematically sound. Ledger integrity 100%.")
    sys.exit(0)


if __name__ == "__main__":
    verify_ledger()
