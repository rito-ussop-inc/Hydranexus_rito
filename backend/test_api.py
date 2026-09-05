"""Smoke tests for HydraNexus API (run: python -m pytest test_api.py -q or python test_api.py)."""
from fastapi.testclient import TestClient
from app.main import app
from app.simulator import generate_telemetry

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_graph():
    r = client.get("/api/network/graph")
    j = r.json()
    assert len(j["nodes"]) == 6 and len(j["edges"]) == 5


def test_telemetry_scenarios():
    for s in ["normal", "leak", "burst", "demand", "sensor"]:
        r = client.get(f"/api/telemetry?scenario={s}&points=8")
        assert r.status_code == 200 and len(r.json()["telemetry"]) == 8


def test_detect_leak():
    data = generate_telemetry("leak")
    r = client.post("/api/ai/detect", json={"telemetry": data})
    j = r.json()
    assert j["anomaly"] is True
    assert j["severity"] in ("HIGH", "MEDIUM")
    assert j["location"]["segment"] == "B2 → B3"
    assert j["impact"]["lossPerHour"] > 1000


def test_detect_normal():
    data = generate_telemetry("normal")
    r = client.post("/api/ai/detect", json={"telemetry": data})
    j = r.json()
    assert j["severity"] in ("NORMAL", "LOW")


def test_verify():
    observed = generate_telemetry("leak")
    r = client.post("/api/verify", json={"observed": observed, "hypothesis": "leak", "segment": "B2 → B3"})
    j = r.json()
    assert j["matchScore"] > 60 and j["verified"] is True


def test_whatif():
    r = client.post("/api/whatif", json={"scenario": "isolate"})
    assert r.json()["lossReductionPct"] > 80
    r = client.post("/api/whatif", json={"scenario": "reducePressure", "valveThrottle": 50})
    assert r.status_code == 200


if __name__ == "__main__":
    for name, fn in sorted({k: v for k, v in globals().items() if k.startswith("test_")}.items()):
        fn()
        print(f"PASS {name}")
