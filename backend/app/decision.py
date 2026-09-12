"""Cost-Aware What-If Decision Support (MVP Extension).

Compares the four standard interventions — Isolate, Throttle, Reroute,
Do Nothing — across water-loss reduction, risk reduction, affected users,
service disruption, operational cost and network impact, then ranks them
and explains the recommendation.

Design notes (per PRD):
- Costs are CONFIGURED PLANNING ESTIMATES, not real-world quotations.
  They live in COST_PARAMS below, separate from simulation logic, so they
  can be recalibrated per utility without touching the decision engine.
- Scoring is Weighted Benefits - Weighted Costs, implemented as a weighted
  average over normalized 0..100 metrics where cost/disruption are inverted
  (affordability / service continuity), so the score stays in 0..100.
- Explanations are generated from the actual comparison metrics, never
  hard-coded per scenario.
- Decision support only: no intervention is ever executed here.

Canonical PRD actions: isolate | throttle | reroute | do_nothing
Existing backend scenario keys: isolate | reducePressure | bypassRoute | doNothing
"""
from __future__ import annotations

# PRD action -> existing WHATIF_CATALOG key
ACTION_TO_SCENARIO = {
    "isolate": "isolate",
    "throttle": "reducePressure",
    "reroute": "bypassRoute",
    "do_nothing": "doNothing",
}
# Reverse + common aliases (input-tolerant)
SCENARIO_TO_ACTION = {v: k for k, v in ACTION_TO_SCENARIO.items()}
ALIAS_TO_ACTION = {
    "isolate": "isolate",
    "throttle": "throttle",
    "reducepressure": "throttle",
    "reduce_pressure": "throttle",
    "reroute": "reroute",
    "bypassroute": "reroute",
    "bypass_route": "reroute",
    "do_nothing": "do_nothing",
    "donothing": "do_nothing",
    "do-nothing": "do_nothing",
    "donothing": "do_nothing",
}

CANONICAL_ACTIONS = ["isolate", "throttle", "reroute", "do_nothing"]

ACTION_LABELS = {
    "isolate": "Isolate",
    "throttle": "Throttle",
    "reroute": "Reroute",
    "do_nothing": "Do Nothing",
}

COST_BASIS_NOTE = (
    "Configured planning estimates for MVP comparison only — "
    "not municipal quotations. Calibrate per utility from historical "
    "maintenance records, labour, equipment, material, contractor and "
    "operational data before real-world use."
)

# Cost + disruption planning parameters, kept separate from simulation logic.
# cost_usd: planning estimate in USD. cost_score/disruption_score: 0..100 (higher = worse).
COST_PARAMS: dict[str, dict] = {
    "isolate": {
        "cost_usd": 2500,
        "cost_score": 65.0,
        "disruption": "High",
        "disruption_score": 75.0,
        "detail": "Crew dispatch + valve operation + customer isolation + reinstatement.",
    },
    "throttle": {
        "cost_usd": 800,
        "cost_score": 35.0,
        "disruption": "Low",
        "disruption_score": 25.0,
        "detail": "PRV adjustment + monitoring, partial service continues.",
    },
    "reroute": {
        "cost_usd": 1800,
        "cost_score": 50.0,
        "disruption": "Medium",
        "disruption_score": 40.0,
        "detail": "Open manual bypass valve + flow rebalancing + inspection.",
    },
    "do_nothing": {
        "cost_usd": 0,
        "cost_score": 0.0,
        "disruption": "None",
        "disruption_score": 5.0,
        "detail": "No immediate intervention cost; monitoring continues.",
    },
}

# Trade-off weights (must sum to ~1.0; normalized at runtime anyway).
# Per PRD: risk + water + service are High importance, cost is Medium.
DEFAULT_WEIGHTS: dict[str, float] = {
    "water": 0.30,
    "risk": 0.30,
    "service": 0.20,
    "cost": 0.10,
    "disruption": 0.10,
}

SEVERITY_BASELINE_RISK = {"HIGH": 90.0, "MEDIUM": 65.0, "LOW": 35.0, "NORMAL": 10.0}

LIMITATIONS = [
    "Cost estimates are configurable planning estimates, not guaranteed real-world prices.",
    "Simulation results depend on the accuracy of the current simulation model.",
    "Decision scores depend on configured weights.",
    "Real utility deployment requires validation against operational data.",
    "Recommendations are decision support and not autonomous control commands.",
]

MAX_USERS_NORM = 560.0  # Zone B population; used to normalize affected users.


def normalize_action(name: str | None) -> str:
    key = (name or "").strip().lower().replace(" ", "_")
    if key in ALIAS_TO_ACTION:
        return ALIAS_TO_ACTION[key]
    return "do_nothing"


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, float(v)))


def risk_reduction_for(water_reduction_pct: float, disruption_score: float,
                       after_pressure: float, severity: str,
                       baseline_loss: float) -> float:
    """Transparent residual-risk estimate.

    Loss reduction drives risk down; disruption adds operational risk;
    healthy restored pressure (>=3.5 bar) earns a small bonus.
    With no pipe loss (sensor/demand/corrosion), interventions carry no
    risk benefit — monitoring wins.
    """
    if baseline_loss <= 0:
        # No breach to fix: any disruptive action only adds risk.
        return _clamp(5.0 - disruption_score * 0.1)
    pressure_bonus = 10.0 if after_pressure >= 3.5 else (-5.0 if after_pressure < 3.1 else 0.0)
    sev = SEVERITY_BASELINE_RISK.get((severity or "HIGH").upper(), 90.0) / 90.0  # 0..1 scale
    raw = water_reduction_pct * 0.85 * (0.7 + 0.3 * sev) - disruption_score * 0.15 + pressure_bonus
    return _clamp(raw)


def service_score_for(affected_users: int, disruption_score: float) -> float:
    users_norm = _clamp((affected_users or 0) / MAX_USERS_NORM * 100.0)
    return _clamp(100.0 - (0.6 * disruption_score + 0.4 * users_norm))


def decision_score_for(water_red: float, risk_red: float, service: float,
                       cost_score: float, disruption_score: float,
                       weights: dict[str, float]) -> float:
    total = sum(max(0.0, float(weights.get(k, 0.0))) for k in ("water", "risk", "service", "cost", "disruption")) or 1.0
    w = {k: max(0.0, float(weights.get(k, DEFAULT_WEIGHTS[k]))) / total for k in DEFAULT_WEIGHTS}
    score = (
        w["water"] * water_red
        + w["risk"] * risk_red
        + w["service"] * service
        + w["cost"] * (100.0 - cost_score)
        + w["disruption"] * (100.0 - disruption_score)
    )
    return round(_clamp(score), 1)


def build_explanation(ranked: list[dict], baseline_loss: float, severity: str) -> dict:
    """Generate Why? bullets from actual metrics — never hard-coded per scenario."""
    best = ranked[0]
    others = ranked[1:]
    bullets: list[str] = []
    action_label = ACTION_LABELS.get(best["action"], best["action"])

    if baseline_loss <= 0:
        bullets.append(
            f"No pipe water-loss in this incident ({baseline_loss:,.0f} L/hr) — "
            f"{action_label} avoids disrupting users while monitoring continues."
        )
    else:
        saved = best.get("water_saved_per_hour", 0)
        bullets.append(
            f"Water-loss reduction {best['water_loss_reduction']:.1f}% "
            f"({saved:,.0f} L/hr saved) vs current {baseline_loss:,.0f} L/hr."
        )
    bullets.append(
        f"Risk reduction {best['risk_reduction']:.1f}% under {severity} severity "
        f"(residual operational risk lowest among effective options)."
        if baseline_loss > 0 else
        f"Lowest residual risk among options (risk reduction {best['risk_reduction']:.1f}%)."
    )
    # Disruption comparison vs the most disruptive alternative
    most_disruptive = max(others, key=lambda o: o["disruption_score"], default=None)
    if most_disruptive and best["disruption_score"] < most_disruptive["disruption_score"]:
        bullets.append(
            f"Lower service disruption ({best['service_disruption']}) than "
            f"{ACTION_LABELS.get(most_disruptive['action'], most_disruptive['action'])} "
            f"({most_disruptive['service_disruption']}) — "
            f"{best['affected_users']} vs {most_disruptive['affected_users']} users affected."
        )
    else:
        bullets.append(
            f"Service impact contained: {best['affected_users']} users, "
            f"disruption {best['service_disruption']}."
        )
    # Cost comparison vs priciest effective option
    priciest = max([o for o in ranked if o["action"] != best["action"] and o["water_loss_reduction"] > 0],
                   key=lambda o: o["estimated_cost_usd"], default=None)
    if priciest and best["estimated_cost_usd"] < priciest["estimated_cost_usd"]:
        bullets.append(
            f"Lower planning cost (${best['estimated_cost_usd']:,} vs "
            f"${priciest['estimated_cost_usd']:,} for "
            f"{ACTION_LABELS.get(priciest['action'], priciest['action'])})."
        )
    elif best["estimated_cost_usd"] == 0:
        bullets.append("Zero immediate intervention cost (monitoring only).")
    else:
        bullets.append(f"Planning cost ${best['estimated_cost_usd']:,} ({COST_BASIS_NOTE.split('.')[0]}).")
    if best["action"] in ("throttle", "reroute") and baseline_loss > 0:
        bullets.append("Maintains partial/full network service while the fault is contained.")
    if best["action"] == "do_nothing" and baseline_loss > 0:
        bullets.append(
            "Caution: losses continue at current rate — escalate if severity rises. "
            "Review triggered because every intervention disrupts more value than it saves."
        )
    summary = (
        f"{action_label} offers the best overall trade-off across configured cost, "
        f"simulated impact ({best['water_loss_reduction']:.1f}% loss reduction) and "
        f"risk metrics (score {best['score']}). Operator review required."
    )
    return {"summary": summary, "bullets": bullets}


def compare_options(incident: str = "leak",
                    severity: str = "HIGH",
                    segment: str = "B2 → B3",
                    baseline_loss: float = 3500.0,
                    whatif_results: dict[str, dict] | None = None,
                    weights: dict[str, float] | None = None,
                    costs: dict[str, dict] | None = None) -> dict:
    """Rank the four interventions. `whatif_results` maps existing scenario keys
    (isolate/reducePressure/bypassRoute/doNothing) to their simulation output
    dicts {before:{loss,pressure,users}, after:{...}, lossReductionPct}."""
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    cost_table = {k: {**v} for k, v in COST_PARAMS.items()}
    for action, override in (costs or {}).items():
        a = normalize_action(action)
        if a in cost_table and isinstance(override, dict):
            for field in ("cost_usd", "cost_score", "disruption_score", "disruption", "detail"):
                if field in override and override[field] is not None:
                    cost_table[a][field] = override[field]
    results = whatif_results or {}
    options: list[dict] = []
    for action in CANONICAL_ACTIONS:
        scenario_key = ACTION_TO_SCENARIO[action]
        sim = results.get(scenario_key) or {}
        before = sim.get("before") or {}
        after = sim.get("after") or {}
        before_loss = float(before.get("loss", baseline_loss))
        after_loss = float(after.get("loss", before_loss))
        water_red = float(sim.get("lossReductionPct",
                                 (round((before_loss - after_loss) / before_loss * 100, 1)
                                  if before_loss > 0 else 0.0)))
        water_red = _clamp(water_red)
        affected_users = int(after.get("users", 0))
        after_pressure = float(after.get("pressure", 3.3))
        cp = cost_table[action]
        risk_red = risk_reduction_for(water_red, float(cp["disruption_score"]),
                                      after_pressure, severity, float(baseline_loss))
        service = service_score_for(affected_users, float(cp["disruption_score"]))
        score = decision_score_for(water_red, risk_red, service,
                                   float(cp["cost_score"]), float(cp["disruption_score"]), w)
        options.append({
            "action": action,
            "scenario": scenario_key,
            "label": ACTION_LABELS[action],
            "score": score,
            "water_loss_reduction": round(water_red, 1),
            "water_saved_per_hour": round(max(0.0, before_loss - after_loss), 1),
            "risk_reduction": round(risk_red, 1),
            "affected_users": affected_users,
            "service_disruption": cp["disruption"],
            "disruption_score": round(float(cp["disruption_score"]), 1),
            "service_score": round(service, 1),
            "estimated_cost_usd": int(cp["cost_usd"]),
            "estimated_cost_score": round(float(cp["cost_score"]), 1),
            "cost_detail": cp["detail"],
            "network_impact": {
                "loss_before": round(before_loss, 1),
                "loss_after": round(after_loss, 1),
                "pressure_after": round(after_pressure, 2),
            },
        })
    ranked = sorted(options, key=lambda o: o["score"], reverse=True)
    for i, opt in enumerate(ranked, start=1):
        opt["rank"] = i
    explanation = build_explanation(ranked, float(baseline_loss), (severity or "HIGH").upper())
    return {
        "incident": (incident or "leak").lower(),
        "severity": (severity or "HIGH").upper(),
        "segment": segment or "B2 → B3",
        "baseline_loss_per_hour": round(float(baseline_loss), 1),
        "options": ranked,
        "recommended_action": ranked[0]["action"],
        "recommended_scenario": ranked[0]["scenario"],
        "reason": explanation["summary"],
        "why": explanation["bullets"],
        "weights_used": {k: round(float(w[k]), 3) for k in DEFAULT_WEIGHTS},
        "cost_basis": COST_BASIS_NOTE,
        "limitations": LIMITATIONS,
        "operatorNote": (
            "Decision support only — ranked recommendation for operator review. "
            "No intervention is executed automatically; a qualified operator makes the final decision."
        ),
    }


def config_payload() -> dict:
    return {
        "actions": [
            {"action": a, "scenario": ACTION_TO_SCENARIO[a], "label": ACTION_LABELS[a],
             **COST_PARAMS[a]}
            for a in CANONICAL_ACTIONS
        ],
        "costs": {a: dict(COST_PARAMS[a]) for a in CANONICAL_ACTIONS},
        "default_weights": dict(DEFAULT_WEIGHTS),
        "aliases": dict(ALIAS_TO_ACTION),
        "cost_basis": COST_BASIS_NOTE,
        "limitations": LIMITATIONS,
    }
