"""AI Intelligence Module (Phase 2 of PRD).

- Anomaly detection: IsolationForest trained on simulated normal telemetry.
- Cause ranking: transparent hybrid (ML anomaly score + hydraulic rules).
- Localization: topology-aware (topology.localize).
- Impact estimation: water-loss + severity.

Human-in-the-loop: every result carries confidence + evidence + operator note.
No autonomous control is ever issued.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from .simulator import (
    BASE_FLOW, BASE_PRESSURE, BASE_CONSUMPTION,
    generate_telemetry, deviation_pct, estimate_loss,
)
from .topology import localize

_MODEL: IsolationForest | None = None

FEATURES = ["flow", "pressure", "consumption"]


def _training_frame(n: int = 1200, seed: int = 42) -> pd.DataFrame:
    rows = generate_telemetry("normal", points=n, seed=seed)
    df = pd.DataFrame(rows)[FEATURES].copy()
    # Normalize so pressure (small scale) contributes fairly
    df["flow"] = df["flow"] / BASE_FLOW
    df["pressure"] = df["pressure"] / BASE_PRESSURE
    df["consumption"] = df["consumption"] / BASE_CONSUMPTION
    return df


def get_model() -> IsolationForest:
    global _MODEL
    if _MODEL is None:
        df = _training_frame()
        _MODEL = IsolationForest(n_estimators=200, contamination=0.04, random_state=42)
        _MODEL.fit(df.values)
    return _MODEL


def ml_anomaly_score(flow: float, pressure: float, consumption: float) -> float:
    """Convert IsolationForest decision to 0..1 anomaly score (1 = very abnormal)."""
    model = get_model()
    x = np.array([[flow / BASE_FLOW, pressure / BASE_PRESSURE, consumption / BASE_CONSUMPTION]])
    # decision_function > 0 normal, < 0 anomaly; score_samples higher = more normal
    s = model.score_samples(x)[0]
    # Map roughly: normal ≈ 0.0-0.15, anomaly → 0.7-0.99
    # Empirically: inliers score ≈ -0.05..0.15 in score_samples space inversion handled below
    decision = model.decision_function(x)[0]
    # Sigmoid-ish mapping
    score = 1.0 / (1.0 + np.exp(6.0 * decision))
    return round(float(np.clip(score, 0.01, 0.99)), 3)


def rank_causes(flow_d: float, pressure_d: float, cons_d: float, anomaly_score: float) -> list[dict]:
    """Transparent rule scores in 0..100, normalized to sum ≈ 100.

    Rules encode hydraulic intuition:
    - Leak: flow ↑, pressure ↓, consumption flat
    - Burst: flow ↑↑, pressure ↓↓
    - Demand spike: consumption ↑↑ with flow ↑
    - Sensor fault: isolated flow spike, pressure flat
    - Valve issue: mild pressure wobble, small flow change
    """
    af, ap, ac = abs(flow_d), abs(pressure_d), abs(cons_d)

    leak = 0.0
    if flow_d > 15 and pressure_d < -8 and ac < 14:
        leak = 55 + min(flow_d, 45) * 0.7 + min(ap, 20) * 0.8
    elif flow_d > 10 and pressure_d < -5:
        leak = 35 + min(flow_d, 30) * 0.5

    burst = 0.0
    if flow_d > 55 and pressure_d < -22:
        burst = 70 + min(flow_d - 55, 40) * 0.6 + min(ap - 22, 25) * 0.7
    elif flow_d > 40 and pressure_d < -15:
        burst = 40 + (flow_d - 40) * 0.5

    demand = 0.0
    if cons_d > 22 and flow_d > 12 and pressure_d > -12:
        demand = 55 + min(cons_d - 22, 30) * 0.8
    elif cons_d > 15:
        demand = 30 + (cons_d - 15) * 0.6

    sensor = 0.0
    if af > 25 and ap < 5 and ac < 8:
        sensor = 60 + min(af - 25, 30) * 0.5
    elif af > 20 and ap < 6:
        sensor = 30

    valve = 0.0
    if ap < 10 and af < 12:
        valve = 22 + (10 - min(ap, 10)) * 0.8
    if -8 < pressure_d < -2 and af < 10:
        valve += 12

    # Weight by ML anomaly score so normal data yields low, flat scores
    confidence_mass = 0.25 + 0.75 * anomaly_score
    raw = {"Pipeline Leak": leak, "Pipe Burst": burst, "Demand Spike": demand, "Sensor Fault": sensor, "Valve Issue": valve}
    # If essentially normal, keep all low
    if anomaly_score < 0.25 and max(raw.values()) < 30:
        return [
            {"cause": "Normal Operation", "score": round((1 - anomaly_score) * 100, 1)},
            {"cause": "Valve Issue", "score": 6.0},
            {"cause": "Demand Spike", "score": 4.0},
            {"cause": "Sensor Fault", "score": 3.0},
        ]
    total = sum(raw.values())
    if total <= 0:
        # Fallback: distribute by anomaly mass
        raw = {"Pipeline Leak": 30 * confidence_mass, "Demand Spike": 25 * confidence_mass,
               "Valve Issue": 20 * confidence_mass, "Sensor Fault": 15 * confidence_mass, "Pipe Burst": 10 * confidence_mass}
        total = sum(raw.values())
    ranked = sorted(raw.items(), key=lambda kv: kv[1], reverse=True)
    out = [{"cause": k, "score": round(v / total * 100, 1)} for k, v in ranked]
    return out


def severity_for(loss_per_hour: float, pressure: float, anomaly_score: float) -> str:
    if loss_per_hour >= 3000 or pressure <= 2.8 or anomaly_score >= 0.9:
        return "HIGH"
    if loss_per_hour >= 1000 or pressure <= 3.4 or anomaly_score >= 0.55:
        return "MEDIUM"
    if anomaly_score >= 0.3 or loss_per_hour > 150:
        return "LOW"
    return "NORMAL"


def build_evidence(latest: dict, dev: dict, causes: list[dict], location: dict) -> list[str]:
    top = causes[0]["cause"] if causes else "Unknown"
    ev = [
        f"Flow {'increased' if dev['flow'] >= 0 else 'decreased'} by {dev['flow']:+.1f}% vs baseline (≈{BASE_FLOW:,.0f} L/hr)",
        f"Pressure {'dropped' if dev['pressure'] < 0 else 'rose'} by {dev['pressure']:+.1f}% vs baseline (≈{BASE_PRESSURE:.1f} bar)",
    ]
    if abs(dev["consumption"]) < 12:
        ev.append(f"End-user metered consumption remained stable ({dev['consumption']:+.1f}%), ruling against a demand-spike pattern")
    else:
        ev.append(f"Metered consumption moved {dev['consumption']:+.1f}%, consistent with demand-side change")
    ev.append(f"Adjacent-zone cross-coupling check: anomaly concentrated in Zone {location.get('zone', 'B')} (topology path {location.get('segment')})")
    ev.append(f"Top hypothesis '{top}' scored {causes[0]['score'] if causes else 0}% with ML anomaly index {latest.get('anomalyScore', 0)}")
    return ev


def analyze(telemetry: list[dict]) -> dict:
    """Full Detect → Investigate → Assess pipeline for a telemetry window."""
    if not telemetry:
        raise ValueError("telemetry window is empty")
    latest = telemetry[-1]
    flow, pressure, consumption = float(latest["flow"]), float(latest["pressure"]), float(latest["consumption"])
    score = ml_anomaly_score(flow, pressure, consumption)
    latest = {**latest, "anomalyScore": score}
    dev = deviation_pct(latest)
    causes = rank_causes(dev["flow"], dev["pressure"], dev["consumption"], score)
    top_cause = causes[0]["cause"]
    # Map cause name to simulator scenario key for verification
    scenario_map = {"Pipeline Leak": "leak", "Pipe Burst": "burst", "Demand Spike": "demand",
                    "Sensor Fault": "sensor", "Valve Issue": "normal", "Normal Operation": "normal"}
    location = localize(dev["flow"], dev["pressure"], dev["consumption"], scenario_map.get(top_cause, ""))
    loss = estimate_loss(flow, consumption)
    loss24 = round(loss * 24, 1)
    severity = severity_for(loss, pressure, score)
    evidence = build_evidence(latest, dev, causes, location)
    is_anomaly = score >= 0.5 or severity in ("HIGH", "MEDIUM")
    return {
        "latest": latest,
        "deviation_pct": {k: round(v, 2) for k, v in dev.items()},
        "anomaly": is_anomaly,
        "anomalyScore": score,
        "severity": severity,
        "causes": causes,
        "primaryHypothesis": top_cause,
        "confidence": round(float(causes[0]["score"]) if causes else 0.0, 1),
        "location": location,
        "impact": {
            "lossPerHour": loss,
            "loss24h": loss24,
            "affectedZone": f"Zone {location.get('zone', 'B')}",
            "affectedUsers": location.get("users", 560),
            "severity": severity,
        },
        "evidence": evidence,
        "operatorNote": (
            "Evidence-backed recommendation only — a qualified operator must approve any intervention. "
            f"Severity {severity} with {loss:,.0f} L/hr estimated loss."
        ),
    }
