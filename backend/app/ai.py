"""AI Intelligence Module (Phase 2 of PRD + Pipe Health fusion).

- Anomaly detection: IsolationForest trained on simulated normal telemetry
  (flow, pressure, consumption + eddy_current_variance).
- Cause ranking: transparent hybrid (ML anomaly score + hydraulic rules
  + structural eddy-current fusion truth table).
- Localization: topology-aware (topology.localize).
- Impact estimation: water-loss + severity.

Fusion truth table (Investigate & Fuse Evidence):
- High flow + pressure drop + high eddy -> Confirmed Leak / Confirmed Burst
- Pressure drop + normal flow + normal eddy -> Sensor Fault (false alarm)
- Normal hydraulics + gradually rising eddy -> Early Corrosion (maintenance)

Human-in-the-loop: every result carries confidence + evidence + operator note.
No autonomous control is ever issued.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from .simulator import (
    BASE_FLOW, BASE_PRESSURE, BASE_CONSUMPTION, BASE_EDDY,
    generate_telemetry, deviation_pct, estimate_loss,
)
from .topology import localize

_MODEL: IsolationForest | None = None

FEATURES = ["flow", "pressure", "consumption", "eddy_current_variance"]

# Structural thresholds on the 0.0 (healthy) .. 1.0 (crack) eddy scale.
EDDY_CRACK = 0.5    # physical breach confirmed
EDDY_WATCH = 0.3    # wall degrading, maintenance attention
EDDY_RISE = 0.25    # gradual increase across the window = corrosion creep


def _training_frame(n: int = 1200, seed: int = 42) -> pd.DataFrame:
    rows = generate_telemetry("normal", points=n, seed=seed)
    df = pd.DataFrame(rows)[FEATURES].copy()
    # Normalize so pressure (small scale) contributes fairly; eddy is already 0..1.
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


def ml_anomaly_score(flow: float, pressure: float, consumption: float, eddy: float = 0.0) -> float:
    """Convert IsolationForest decision to 0..1 anomaly score (1 = very abnormal)."""
    model = get_model()
    x = np.array([[flow / BASE_FLOW, pressure / BASE_PRESSURE, consumption / BASE_CONSUMPTION,
                   max(0.0, min(1.0, float(eddy)))]])
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


def pipe_condition(eddy_last: float, eddy_rise: float) -> dict:
    """Pipe Condition Analysis mapped from eddy-current evidence."""
    if eddy_last >= EDDY_CRACK:
        return {"state": "Crack", "detail": "Critical structural failure — wall breached",
                "eddy": round(eddy_last, 3), "trend": round(eddy_rise, 3)}
    if eddy_last >= EDDY_WATCH or eddy_rise >= EDDY_RISE:
        return {"state": "Corrosion", "detail": "Wall degradation — maintenance attention",
                "eddy": round(eddy_last, 3), "trend": round(eddy_rise, 3)}
    return {"state": "Healthy", "detail": "Pipe wall intact — no structural damage",
            "eddy": round(eddy_last, 3), "trend": round(eddy_rise, 3)}


def fuse_hydraulic_structural(causes: list[dict], dev: dict, eddy_last: float, eddy_rise: float) -> tuple[list[dict], str, dict]:
    """Apply the PRD truth table over hydraulic ranking + eddy evidence.

    Returns (reordered causes, primary hypothesis label, pipe condition).
    """
    flow_d, pressure_d, cons_d = dev["flow"], dev["pressure"], dev["consumption"]
    hydraulics_normal = abs(flow_d) < 12 and abs(pressure_d) < 8 and abs(cons_d) < 12
    pressure_drop_only = pressure_d < -8 and abs(flow_d) < 12 and abs(cons_d) < 12
    high_flow_drop = flow_d > 15 and pressure_d < -8

    def _renorm(items: list[dict]) -> list[dict]:
        total = sum(i["score"] for i in items) or 1.0
        return [{"cause": i["cause"], "score": round(i["score"] / total * 100, 1)} for i in items]

    top = causes[0]["cause"] if causes else "Unknown"

    # 3) Early corrosion: normal hydraulics, wall slowly weakening.
    if hydraulics_normal and (eddy_last >= EDDY_WATCH or eddy_rise >= EDDY_RISE):
        rest = [c for c in causes if c["cause"] != "Early Corrosion"]
        fused = [{"cause": "Early Corrosion", "score": 75.0}]
        for c in rest[:3]:
            fused.append({"cause": c["cause"], "score": c["score"] * 0.25})
        return _renorm(fused), "Early Corrosion", pipe_condition(eddy_last, eddy_rise)

    # 2) Sensor fault / false alarm: pressure drops but wall intact and flow normal.
    if pressure_drop_only and eddy_last < 0.15:
        rest = [c for c in causes if c["cause"] != "Sensor Fault"]
        fused = [{"cause": "Sensor Fault", "score": 80.0}]
        for c in rest[:3]:
            fused.append({"cause": c["cause"], "score": c["score"] * 0.25})
        return _renorm(fused), "Sensor Fault", pipe_condition(eddy_last, eddy_rise)

    # 1) Confirmed breach: hydraulic event + physical crack seen by eddy sensor.
    # Burst vs leak is decided by signature magnitude (robust to rule ties):
    # burst = very large flow rise + very deep pressure drop.
    if high_flow_drop and eddy_last >= EDDY_CRACK:
        burst_pattern = flow_d > 55 and pressure_d < -22
        confirmed = "Confirmed Burst" if burst_pattern else "Confirmed Leak"
        sibling = "Pipeline Leak" if burst_pattern else "Pipe Burst"
        sib_score = next((c["score"] for c in causes if c["cause"] == sibling), 0.0)
        rest = [c for c in causes if c["cause"] not in ("Pipe Burst", "Pipeline Leak", sibling)]
        lead = 70.0 + min(20.0, abs(flow_d) / 5.0)
        fused = [{"cause": confirmed, "score": lead}, {"cause": sibling, "score": sib_score * 0.3}]
        for c in rest[:2]:
            fused.append({"cause": c["cause"], "score": c["score"] * 0.25})
        return _renorm(fused), confirmed, pipe_condition(eddy_last, eddy_rise)

    return causes, top, pipe_condition(eddy_last, eddy_rise)


def build_evidence(latest: dict, dev: dict, causes: list[dict], location: dict,
                   eddy_last: float, eddy_rise: float, pipe: dict) -> list[str]:
    from .simulator import BASE_LEVEL
    top = causes[0]["cause"] if causes else "Unknown"
    ev = [
        f"Flow {'increased' if dev['flow'] >= 0 else 'decreased'} by {dev['flow']:+.1f}% vs baseline (≈{BASE_FLOW:,.0f} L/hr)",
        f"Pressure {'dropped' if dev['pressure'] < 0 else 'rose'} by {dev['pressure']:+.1f}% vs baseline (≈{BASE_PRESSURE:.1f} bar)",
    ]
    if abs(dev["consumption"]) < 12:
        ev.append(f"End-user metered consumption remained stable ({dev['consumption']:+.1f}%), ruling against a demand-spike pattern")
    else:
        ev.append(f"Metered consumption moved {dev['consumption']:+.1f}%, consistent with demand-side change")
    lvl = latest.get("level")
    if lvl is not None:
        if dev.get("level", 0) < -5:
            ev.append(f"Storage tank level fell to {lvl:.2f} m vs baseline (≈{BASE_LEVEL:.1f} m), confirming upstream loss/draw")
        else:
            ev.append(f"Storage tank level held at {lvl:.2f} m, ruling against a major loss pattern")
    # Fused structural evidence (dual-track: hydraulics + eddy current).
    if pipe["state"] == "Crack":
        ev.append(f"Eddy-current sensor detected structural failure (variance {eddy_last:.2f}) — physical crack confirms the hydraulic event. Sensor malfunction ruled out.")
    elif top in ("Sensor Fault",) or (abs(dev["pressure"]) >= 8 and eddy_last < 0.15 and pipe["state"] == "Healthy"):
        ev.append(f"Eddy-current variance normal ({eddy_last:.2f}) — pipe wall intact. Pressure change is a sensor false alarm, not a breach.")
    elif pipe["state"] == "Corrosion":
        ev.append(f"Eddy-current variance creeping to {eddy_last:.2f} (trend {eddy_rise:+.2f}) with normal pressure — early wall degradation. Schedule maintenance before a breach.")
    ev.append(f"Adjacent-zone cross-coupling check: anomaly concentrated in Zone {location.get('zone', 'B')} (topology path {location.get('segment')})")
    ev.append(f"Top hypothesis '{top}' scored {causes[0]['score'] if causes else 0}% with ML anomaly index {latest.get('anomalyScore', 0)}")
    return ev


def analyze(telemetry: list[dict]) -> dict:
    """Full Detect → Investigate → Assess pipeline for a telemetry window."""
    if not telemetry:
        raise ValueError("telemetry window is empty")
    latest = telemetry[-1]
    flow, pressure, consumption = float(latest["flow"]), float(latest["pressure"]), float(latest["consumption"])
    eddy_last = float(latest.get("eddy_current_variance") or 0.0)
    eddy_first = float(telemetry[0].get("eddy_current_variance") or 0.0)
    eddy_rise = eddy_last - eddy_first
    score = ml_anomaly_score(flow, pressure, consumption, eddy_last)
    latest = {**latest, "anomalyScore": score}
    dev = deviation_pct(latest)
    causes = rank_causes(dev["flow"], dev["pressure"], dev["consumption"], score)
    causes, top_cause, pipe = fuse_hydraulic_structural(causes, dev, eddy_last, eddy_rise)
    # Map cause name to simulator scenario key for verification
    scenario_map = {"Confirmed Leak": "leak", "Confirmed Burst": "burst", "Pipeline Leak": "leak",
                    "Pipe Burst": "burst", "Demand Spike": "demand", "Early Corrosion": "corrosion",
                    "Sensor Fault": "sensor", "Valve Issue": "normal", "Normal Operation": "normal"}
    location = localize(dev["flow"], dev["pressure"], dev["consumption"], scenario_map.get(top_cause, ""))
    loss = estimate_loss(flow, consumption)
    # No pipe leakage for non-loss hypotheses: extra flow is consumed, a sensor error,
    # or wall degradation without a breach yet.
    if top_cause in ("Demand Spike", "Sensor Fault", "Normal Operation", "Early Corrosion"):
        loss = 0.0
    loss24 = round(loss * 24, 1)
    severity = severity_for(loss, pressure, score)
    if top_cause == "Early Corrosion" and severity == "HIGH":
        severity = "MEDIUM"  # maintenance warning, not an emergency
    evidence = build_evidence(latest, dev, causes, location, eddy_last, eddy_rise, pipe)
    is_anomaly = score >= 0.5 or severity in ("HIGH", "MEDIUM") or top_cause == "Early Corrosion"
    operator_note = (
        "Evidence-backed recommendation only — a qualified operator must approve any intervention. "
        f"Severity {severity} with {loss:,.0f} L/hr estimated loss."
    )
    if top_cause == "Early Corrosion":
        operator_note = (
            "Maintenance warning — wall degradation detected before any breach. "
            "Schedule inspection; no emergency isolation required. Operator decides."
        )
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
        "pipeCondition": pipe,
        "impact": {
            "lossPerHour": loss,
            "loss24h": loss24,
            "affectedZone": f"Zone {location.get('zone', 'B')}",
            "affectedUsers": location.get("users", 560),
            "severity": severity,
        },
        "evidence": evidence,
        "operatorNote": operator_note,
    }
