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
    assert len(j["nodes"]) == 8 and len(j["edges"]) == 7
    assert "tanks" in j and len(j["tanks"]) == 2


def test_telemetry_scenarios():
    for s in ["normal", "leak", "burst", "demand", "sensor", "corrosion"]:
        r = client.get(f"/api/telemetry?scenario={s}&points=8")
        assert r.status_code == 200 and len(r.json()["telemetry"]) == 8


def test_eddy_fusion_tracks():
    leak = generate_telemetry("leak")
    assert leak[-1]["eddy_current_variance"] >= 0.7  # physical crack
    burst = generate_telemetry("burst")
    assert burst[-1]["eddy_current_variance"] >= 0.8
    sensor = generate_telemetry("sensor", points=8)
    assert max(p["eddy_current_variance"] for p in sensor) < 0.15  # healthy wall
    corr = generate_telemetry("corrosion", points=8)
    assert corr[-1]["eddy_current_variance"] > corr[0]["eddy_current_variance"]  # creeping rise
    assert abs(corr[-1]["pressure"] - 4.0) < 0.3  # hydraulics normal


def test_fusion_truth_table():
    from app.ai import analyze
    leak = analyze(generate_telemetry("leak"))
    assert leak["primaryHypothesis"] == "Confirmed Leak"
    assert leak["pipeCondition"]["state"] == "Crack"
    burst = analyze(generate_telemetry("burst"))
    assert burst["primaryHypothesis"] == "Confirmed Burst"
    sensor = analyze(generate_telemetry("sensor"))
    assert sensor["primaryHypothesis"] == "Sensor Fault"
    assert sensor["pipeCondition"]["state"] == "Healthy"
    assert sensor["impact"]["lossPerHour"] == 0.0
    corr = analyze(generate_telemetry("corrosion"))
    assert corr["primaryHypothesis"] == "Early Corrosion"
    assert corr["impact"]["lossPerHour"] == 0.0


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
    # Corrosion hypothesis is accepted and self-matches.
    obs_c = generate_telemetry("corrosion")
    r = client.post("/api/verify", json={"observed": obs_c, "hypothesis": "corrosion", "segment": "B2 → B3"})
    assert r.json()["hypothesis"] == "corrosion"


def test_whatif():
    r = client.post("/api/whatif", json={"scenario": "isolate"})
    assert r.json()["lossReductionPct"] > 80
    r = client.post("/api/whatif", json={"scenario": "reducePressure", "valveThrottle": 50})
    assert r.status_code == 200
    # Scenario-aware scaling: burst baseline is larger than leak
    r_leak = client.post("/api/whatif", json={"scenario": "isolate", "incident": "leak"})
    r_burst = client.post("/api/whatif", json={"scenario": "isolate", "incident": "burst"})
    assert r_burst.json()["before"]["loss"] > r_leak.json()["before"]["loss"]
    # Demand has no pipe loss
    r_dem = client.post("/api/whatif", json={"scenario": "isolate", "incident": "demand"})
    assert r_dem.json()["before"]["loss"] == 0 and r_dem.json()["lossReductionPct"] == 0.0
    # Corrosion watch: no loss yet, inspection note instead of isolation math
    r_cor = client.post("/api/whatif", json={"scenario": "isolate", "incident": "corrosion"})
    assert r_cor.json()["before"]["loss"] == 0 and "inspection" in r_cor.json()["notes"].lower()


def test_incidents_fallback():
    # Without SUPABASE env locally, must fall back to mock list (demo never breaks).
    r = client.get("/api/incidents")
    j = r.json()
    assert r.status_code == 200 and len(j["incidents"]) >= 3
    assert j.get("source") in ("mock", "supabase")


if __name__ == "__main__":
    for name, fn in sorted({k: v for k, v in globals().items() if k.startswith("test_")}.items()):
        fn()
        print(f"PASS {name}")
