"""
Bayora Safe Zero-Exposure Observability Monitor (Gap 11)
Captures only high-level runtime metadata (counts, duration, verdict).
Strictly NEVER receives prompt payload or completion text.
"""
import time
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title=Bayora Safe Observability Monitor, version=1.0.0)

METRICS = {
    total_evals: 0,
    blocks: 0,
    allows: 0,
    overrun_aborts: 0,
    recent_telemetry: []
}

class TelemetryRecord(BaseModel):
    turn_uuid: str
    client_id: str
    decision: str
    duration_ms: float

@app.get(/health)
def health():
    return {status: HEALTHY, service: safe_monitor, metrics: METRICS}

@app.post(/telemetry)
def log_telemetry(record: TelemetryRecord):
    METRICS[total_evals] += 1
    if record.decision == ALLOW:
        METRICS[allows] += 1
    elif record.decision == OVERRUN_ABORT:
        METRICS[overrun_aborts] += 1
    else:
        METRICS[blocks] += 1

    entry = {
        timestamp: time.time(),
        turn_uuid: record.turn_uuid,
        client_id: record.client_id,
        verdict: record.decision,
        latency_ms: record.duration_ms
    }
    METRICS[recent_telemetry].append(entry)
    if len(METRICS[recent_telemetry]) > 50:
        METRICS[recent_telemetry].pop(0)

    return {status: ACKNOWLEDGED}

if __name__ == __main__:
    import uvicorn
    uvicorn.run(app, host=0.0.0.0, port=8000)
