"""
BAYORA SOVEREIGN AI SAFETY PLATFORM — MULTI-SERVICE RUNNER
Track 04: AI Safety & Red/Blue Team Evaluation Isolation Infrastructure

Launches the complete distributed microservice mesh:
  1. Blue Team Guardrail Service (FastAPI Microservice on Port 8001)
     - Neural Transformer (all-MiniLM-L6-v2) + Layer A/B/C inspection
     - Token authenticated: Bearer token_blue_secret_456
  2. Bayora Enterprise API Gateway (FastAPI Gateway on Port 8000)
     - Programmatic /v1/inspect, HMAC ledger, and compliance posture
     - Inter-service REST communication with Blue Team over HTTP

Run with:
  python run_services.py
"""

import os
import sys
import time
import subprocess
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    print("=" * 75)
    print("  BAYORA SOVEREIGN AI PLATFORM — MICROSERVICE MESH LAUNCHER")
    print("=" * 75)
    print("  [1/2] Launching Blue Team Guardrail Microservice (Port 8001)...")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = BASE_DIR
    env["RULES_FILE_PATH"] = os.path.join(BASE_DIR, "blue_team", "rules", "guardrails.json")
    env["AUTH_TOKEN"] = "token_blue_secret_456"

    p_blue = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "blue_team.guardrail_service:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=BASE_DIR,
        env=env
    )

    print("  Waiting 2.0s for Blue Team initialization...")
    time.sleep(2.0)

    print("  [2/2] Launching Bayora API Gateway (Port 8000)...")
    p_gateway = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BASE_DIR,
        env=env
    )

    print("\n" + "=" * 75)
    print("  MICROSERVICE MESH RUNNING:")
    print("    * Blue Team Microservice : http://localhost:8001/docs")
    print("    * Bayora API Gateway     : http://localhost:8000/docs")
    print("    * Interactive Swagger UI : http://localhost:8000/docs")
    print("    * Cryptographic Health   : http://localhost:8000/health")
    print("  Press Ctrl+C to gracefully terminate both services.")
    print("=" * 75 + "\n")

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Terminating services gracefully...")
        p_gateway.terminate()
        p_blue.terminate()
        p_gateway.wait()
        p_blue.wait()
        print("[SHUTDOWN] Both services stopped successfully.")

if __name__ == "__main__":
    main()
