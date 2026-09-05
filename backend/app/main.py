"""HydraNexus FastAPI backend — AI-powered water decision intelligence (MVP).

Pipeline: Detect → Investigate → Verify → Assess → Simulate → Decide
Principle: software-first (simulated telemetry), human-in-the-loop (no autonomous control).
"""
from __future__ import annotations
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import DetectRequest, VerifyRequest, WhatIfRequest
from .simulator import generate_telemetry, simulate_expected, rmse, to_dataframe
from .topology import graph_payload
from .ai import analyze, get_model

app = FastAPI(
    title="HydraNexus API",
    version="0.1.0",
    description="Software-first water infrastructure decision intelligence: Detect → Investigate → Verify → Assess → Simulate → Decide.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon MVP; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _warmup():
    # Train IsolationForest once so first request is fast
    get_model()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "hydranexus-api", "version": "0.1.0", "mode": "simulated"}


@app.get("/api/network/graph")
def network_graph(incidentActive: bool = False):
    return graph_payload(incident_active=incidentActive)


@app.get("/api/telemetry")
def telemetry(
    scenario: str = Query(default="normal", description="normal|leak|burst|demand|sensor"),
    points: int = Query(default=8, ge=4, le=48),
    seed: int = Query(default=7),
):
    data = generate_telemetry(scenario=scenario, points=points, seed=seed)
    return {"scenario": scenario.lower(), "points": len(data), "telemetry": data}


INCIDENT_HISTORY = [
    {"id": "INC-1048", "title": "Probable pipeline leak", "type": "Leak", "location": "B2 → B3",
     "zone": "Zone B", "started": "14:00 today", "status": "Investigating", "severity": "HIGH", "confidence": 76},
    {"id": "INC-1045", "title": "Possible demand spike", "type": "Demand", "location": "C1 → Zone C",
     "zone": "Zone C", "started": "12:40 today", "status": "Resolved", "severity": "MEDIUM", "confidence": 83},
    {"id": "INC-1039", "title": "Transient PRV oscillation", "type": "Valve", "location": "N1 Junction",
     "zone": "Zone A", "started": "Yesterday 09:15", "status": "Resolved", "severity": "LOW", "confidence": 91},
]


@app.get("/api/incidents")
def incidents():
    return {"incidents": INCIDENT_HISTORY}


@app.post("/api/ai/detect")
def ai_detect(body: DetectRequest):
    try:
        result = analyze([p.model_dump() for p in body.telemetry])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@app.get("/api/ai/alerts")
def ai_alerts(scenario: str = Query(default="leak"), points: int = Query(default=8, ge=4, le=48)):
    """Convenience: generate a scenario window then run the full AI pipeline."""
    data = generate_telemetry(scenario=scenario, points=points)
    result = analyze(data)
    return {"scenario": scenario.lower(), "telemetry": data, "analysis": result}


@app.get("/api/impact")
def impact(scenario: str = Query(default="leak"), points: int = Query(default=8, ge=4, le=48)):
    data = generate_telemetry(scenario=scenario, points=points)
    result = analyze(data)
    return {"scenario": scenario.lower(), "impact": result["impact"], "severity": result["severity"],
            "location": result["location"], "evidence": result["evidence"]}


WHATIF_CATALOG = {
    "isolate": {"label": "Isolate B2 → B3 (Valve Closure 100%)",
                "before": {"loss": 3500, "pressure": 3.3, "users": 0},
                "after": {"loss": 300, "pressure": 3.0, "users": 120},
                "notes": "Maximizes loss reduction (91.4% saved), but isolates 120 customer connections in Zone B until bypass is engaged."},
    "reducePressure": {"label": "Throttle PRV (Pressure Drop to 3.0 bar)",
                "before": {"loss": 3500, "pressure": 3.3, "users": 0},
                "after": {"loss": 1575, "pressure": 3.15, "users": 0},
                "notes": "Cuts leakage rate by ~55% while maintaining minimum service pressure for all connected customers."},
    "bypassRoute": {"label": "Reroute via Parallel Sub-main B1-Alt",
                "before": {"loss": 3500, "pressure": 3.3, "users": 0},
                "after": {"loss": 450, "pressure": 3.8, "users": 15},
                "notes": "Maintains 97% supply pressure and isolates leak, requires opening manual valve V-42."},
    "doNothing": {"label": "Do Nothing (Monitor baseline)",
                "before": {"loss": 3500, "pressure": 3.3, "users": 0},
                "after": {"loss": 3500, "pressure": 3.3, "users": 0},
                "notes": "Continuous loss of 3,500 L/hr (84,000 L/day) leading to potential ground erosion."},
}


@app.post("/api/verify")
def verify(body: VerifyRequest):
    """Scenario verification: compare observed anomaly vs simulated hypothesis.

    Returns evidence strength (0..100). High score => observed matches hypothesis.
    """
    hypothesis = (body.hypothesis or "leak").lower()
    if hypothesis not in ("leak", "burst", "demand", "sensor", "normal"):
        hypothesis = "leak"
    observed = [p.model_dump() for p in body.observed]
    if len(observed) < 3:
        raise HTTPException(status_code=400, detail="observed window needs >= 3 points")
    expected = simulate_expected(hypothesis, points=len(observed))
    # Compare normalized flow+pressure trajectories
    import math
    of = [o["flow"] / 8000.0 for o in observed]
    ef = [e["flow"] / 8000.0 for e in expected]
    op = [o["pressure"] / 4.0 for o in observed]
    ep = [e["pressure"] / 4.0 for e in expected]
    flow_rmse = rmse(of, ef)
    press_rmse = rmse(op, ep)
    combined = 0.6 * flow_rmse + 0.4 * press_rmse
    # Map RMSE (~0 good, ~0.5 bad) to 0..100
    match = max(0.0, min(100.0, 100.0 * math.exp(-4.5 * combined)))
    verified = match >= 60.0
    return {
        "hypothesis": hypothesis,
        "segment": body.segment,
        "matchScore": round(match, 1),
        "verified": verified,
        "flowRmse": round(flow_rmse, 4),
        "pressureRmse": round(press_rmse, 4),
        "evidenceStrength": "STRONG" if match >= 75 else "MODERATE" if match >= 60 else "WEAK",
        "simulated": expected,
        "explanation": (
            f"Observed trajectory matches a simulated {hypothesis} at {body.segment} "
            f"with {match:.1f}% similarity. {'Hypothesis SUPPORTED — proceed to impact assessment.' if verified else 'Hypothesis WEAK — consider alternative causes.'}"
        ),
        "operatorNote": "Verification is advisory only; operator approval required before any intervention.",
    }


@app.post("/api/whatif")
def whatif(body: WhatIfRequest):
    key = (body.scenario or "isolate")
    if key not in WHATIF_CATALOG:
        raise HTTPException(status_code=400, detail=f"unknown scenario '{key}'. Choose {sorted(WHATIF_CATALOG)}")
    item = WHATIF_CATALOG[key]
    after_loss = item["after"]["loss"]
    # PRV throttle interpolates loss (mirrors frontend WhatIfPage logic)
    if key == "reducePressure":
        throttle = max(0.0, min(100.0, float(body.valveThrottle or 50)))
        factor = (100 - throttle) / 100.0
        after_loss = round(3500 * (0.45 + factor * 0.55))
    before_loss = item["before"]["loss"]
    reduction = round((before_loss - after_loss) / before_loss * 100, 1) if before_loss else 0.0
    return {
        "scenario": key,
        "label": item["label"],
        "before": item["before"],
        "after": {**item["after"], "loss": after_loss},
        "lossReductionPct": reduction,
        "notes": item["notes"],
        "operatorNote": "Simulation is advisory. Human operator decides and remains accountable.",
    }


@app.get("/api/whatif/options")
def whatif_options():
    return {"options": WHATIF_CATALOG}
