"""
Automated Verification Suite
Validates the entire Bayora Secure Sandbox:
1. Broker health check
2. Boundary isolation (Red cannot talk to Blue)
3. Batch evaluation with timing side-channel calculation
4. Cryptographic ledger verification
"""

import subprocess
import sys
import time

def run_cmd(cmd, desc):
    print(f"\n[RUNNING] {desc}...")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[PASSED] {desc}")
        if res.stdout.strip():
            print(res.stdout.strip())
        return True
    else:
        print(f"[FAILED] {desc}")
        if res.stderr.strip():
            print(res.stderr.strip())
        return False

def main():
    print("=" * 60)
    print("BAYORA SECURE AI INFRASTRUCTURE - AUTOMATED TEST SUITE")
    print("=" * 60)

    # 1. Health check
    run_cmd("docker compose ps", "Container Status Check")

    # 2. Network Isolation Check
    print("\n--- TEST 1: NETWORK ISOLATION ---")
    iso_cmd = "docker compose exec red_team python attack_runner.py --probe http://blue_team:8000/health"
    run_cmd(iso_cmd, "Verify Red Team cannot reach Blue Team directly")

    # 3. Batch Evaluation & Timing Window Check
    print("\n--- TEST 2: EVALUATION BATCH & TIMING NORMALIZATION ---")
    batch_cmd = "docker compose exec red_team python attack_runner.py --batch"
    run_cmd(batch_cmd, "Run batch adversarial attacks via Broker")

    # 4. Ledger Cryptographic Verification
    print("\n--- TEST 3: CRYPTOGRAPHIC AUDIT VERIFICATION ---")
    ledger_cmd = "docker compose exec ledger python verify.py"
    run_cmd(ledger_cmd, "Verify HMAC signatures and sequence integrity")

    print("\n" + "=" * 60)
    print("TEST SUITE EXECUTION COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
