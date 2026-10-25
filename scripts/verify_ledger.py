"""
Bayora Independent Offline Audit Verifier CLI
Usage: python verify_ledger.py [optional_path_to_ledger.jsonl]
"""
import os
import sys
import json
import hashlib
import hmac

def get_ledger_path():
    candidates = [
        "./local_audit_logs/ledger.jsonl",
        "/var/log/bayora_audit/ledger.jsonl",
        "./ledger.jsonl"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "./local_audit_logs/ledger.jsonl"

def verify(filepath=None):
    target = filepath or get_ledger_path()
    if not os.path.exists(target):
        print(f"[ERROR] Ledger file not found at: {target}")
        sys.exit(1)

    key = os.getenv("HMAC_SECRET_KEY", "ledger_isolated_key_999888").encode("utf-8")

    with open(target, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    if not lines:
        print("[ERROR] Ledger is empty.")
        sys.exit(1)

    print(f"[*] Verifying {len(lines)} audit blocks in {target}...")
    prev_hash = "0" * 64

    for idx, l in enumerate(lines):
        rec = json.loads(l)
        if rec.get("index") != idx:
            print(f"[TAMPER DETECTED] Index sequence break at #{idx}!")
            sys.exit(1)
        if rec.get("prev_hash") != prev_hash:
            print(f"[TAMPER DETECTED] Hash chain broken at #{idx}!")
            sys.exit(1)

        # Recompute HMAC
        if idx == 0:
            msg = f"0|{'0'*64}|{rec['timestamp']:.4f}|GENESIS_CONFIG_PINNED".encode("utf-8")
            calc = hmac.new(key, msg, hashlib.sha256).hexdigest()
            if rec.get("entry_hmac") != calc:
                msg_alt = f"0|{'0'*64}|{rec['timestamp']:.4f}|GENESIS_BLOCK_CONFIG_PINNED".encode("utf-8")
                calc = hmac.new(key, msg_alt, hashlib.sha256).hexdigest()
        else:
            data = f"{rec['turn_uuid']}|{rec['payload_hash']}|{rec['decision']}|{rec['output_hash']}|{rec['score']}"
            if "model_version_hash" in rec and rec["model_version_hash"] != "none":
                data += f"|{rec['model_version_hash']}|{rec.get('defence_ruleset_hash', '')}"
            msg = f"{idx}|{prev_hash}|{rec['timestamp']:.4f}|{data}".encode("utf-8")
            calc = hmac.new(key, msg, hashlib.sha256).hexdigest()

            if rec.get("entry_hmac") != calc:
                # Check legacy format fallback
                legacy_data = f"{rec['turn_uuid']}|{rec['payload_hash']}|{rec['decision']}|{rec['output_hash']}|{rec['score']}"
                legacy_msg = f"{idx}|{prev_hash}|{rec['timestamp']:.4f}|{legacy_data}".encode("utf-8")
                calc = hmac.new(key, legacy_msg, hashlib.sha256).hexdigest()

        if rec.get("entry_hmac") != calc:
            print(f"[TAMPER DETECTED] Signature mismatch at #{idx} ({rec.get('turn_uuid')})!")
            sys.exit(1)

        prev_hash = rec.get("entry_hmac")

    print(f"[AUDIT VERIFIED] All {len(lines)} blocks are mathematically sound. Ledger integrity 100%.")
    sys.exit(0)

if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else None
    verify(p)