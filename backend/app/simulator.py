"""Software-first telemetry simulator (Phase 1 of PRD).

Generates realistic normal telemetry with Pandas/NumPy and injects
controlled failure scenarios: leak, burst, demand spike, sensor fault.

Baseline (matches frontend mock):
  flow ≈ 8000 L/hr, pressure ≈ 4.0 bar, consumption ≈ 3000 L/hr
"""
from __future__ import annotations
import math
import numpy as np
import pandas as pd

BASE_FLOW = 8000.0
BASE_PRESSURE = 4.0
BASE_CONSUMPTION = 3000.0

SCENARIOS = ("normal", "leak", "burst", "demand", "sensor")


def _time_labels(n: int, start_hour: int = 8) -> list[str]:
    return [f"{(start_hour + i) % 24:02d}:00" for i in range(n)]


def generate_telemetry(scenario: str = "normal", points: int = 8, seed: int = 7) -> list[dict]:
    scenario = (scenario or "normal").lower()
    if scenario not in SCENARIOS:
        scenario = "normal"
    points = max(4, min(48, int(points)))
    rng = np.random.default_rng(seed + hash(scenario) % 10_000)

    t = np.arange(points)
    # Gentle diurnal drift + noise for realism
    drift = 120 * np.sin(2 * np.pi * t / 8.0)
    flow = BASE_FLOW + drift + rng.normal(0, 90, points)
    pressure = BASE_PRESSURE + 0.06 * np.cos(2 * np.pi * t / 6.0) + rng.normal(0, 0.05, points)
    consumption = BASE_CONSUMPTION + 60 * np.sin(2 * np.pi * t / 7.0) + rng.normal(0, 55, points)

    # Inject failure in the last third (mirrors frontend data.js which diverges at 13:00-15:00)
    fault_start = max(1, (points * 2) // 3)
    idx = np.arange(points) >= fault_start
    k = np.sum(idx)

    if scenario == "leak" and k:
        # +~40% flow, -~0.7 bar pressure, stable consumption
        ramp = np.linspace(0.6, 1.0, k)
        flow[idx] += (BASE_FLOW * 0.42) * ramp + rng.normal(0, 80, k)
        pressure[idx] -= 0.75 * ramp + rng.normal(0, 0.03, k) * 0.2
    elif scenario == "burst" and k:
        ramp = np.linspace(0.8, 1.0, k)
        flow[idx] += (BASE_FLOW * 0.88) * ramp + rng.normal(0, 120, k)
        pressure[idx] -= 1.65 * ramp
    elif scenario == "demand" and k:
        ramp = np.linspace(0.7, 1.0, k)
        consumption[idx] += 1350 * ramp + rng.normal(0, 60, k)
        flow[idx] += 2700 * ramp + rng.normal(0, 90, k)
        pressure[idx] -= 0.32 * ramp
    elif scenario == "sensor" and k:
        # Single-point spike, pressure stable (classic sensor fault signature)
        spike_at = fault_start + (k // 2)
        if spike_at < points:
            flow[spike_at] += 3900
            # pressure deliberately untouched; consumption untouched

    flow = np.clip(flow, 1000, 18000)
    pressure = np.clip(pressure, 1.5, 5.0)
    consumption = np.clip(consumption, 800, 7000)

    # Provisional anomaly score (refined by AI module with IsolationForest)
    scores = []
    for f, p, c in zip(flow, pressure, consumption):
        df = abs(f - BASE_FLOW) / BASE_FLOW
        dp = abs(p - BASE_PRESSURE) / BASE_PRESSURE
        dc = abs(c - BASE_CONSUMPTION) / BASE_CONSUMPTION
        s = min(0.99, 0.55 * df * 3 + 0.35 * dp * 4 + 0.10 * dc * 2)
        scores.append(round(float(max(0.01, s)), 3))

    times = _time_labels(points)
    out = []
    for i in range(points):
        out.append({
            "time": times[i],
            "flow": round(float(flow[i]), 1),
            "pressure": round(float(pressure[i]), 2),
            "consumption": round(float(consumption[i]), 1),
            "anomalyScore": scores[i],
        })
    return out


def to_dataframe(telemetry: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(telemetry)


def baseline_stats() -> dict:
    return {"flow": BASE_FLOW, "pressure": BASE_PRESSURE, "consumption": BASE_CONSUMPTION}


def deviation_pct(observed: dict, baseline: dict | None = None) -> dict:
    b = baseline or baseline_stats()
    return {
        "flow": (observed["flow"] - b["flow"]) / b["flow"] * 100.0,
        "pressure": (observed["pressure"] - b["pressure"]) / b["pressure"] * 100.0,
        "consumption": (observed["consumption"] - b["consumption"]) / b["consumption"] * 100.0,
    }


def estimate_loss(flow: float, consumption: float) -> float:
    """Water-loss estimate: unexplained flow after accounting for metered consumption rise."""
    expected_consumption_rise = max(0.0, consumption - BASE_CONSUMPTION)
    loss = (flow - BASE_FLOW) - expected_consumption_rise
    return round(float(max(0.0, loss)), 1)


def simulate_expected(scenario: str, points: int = 8, seed: int = 7) -> list[dict]:
    """Expected pattern for a hypothesized failure (used for scenario verification)."""
    return generate_telemetry(scenario=scenario, points=points, seed=seed)


def rmse(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    if n == 0:
        return float("inf")
    return float(math.sqrt(sum((x - y) ** 2 for x, y in zip(a[:n], b[:n])) / n))
