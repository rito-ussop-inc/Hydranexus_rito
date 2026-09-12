"""Runtime data loader for BattLeDIM 2018 L-Town SCADA and Leakage datasets.

Inspects delimiters and decimal separators programmatically at runtime.
Caches parsed data in-memory to ensure low-latency API response times.
Never embeds raw CSV contents into source code.
"""
from __future__ import annotations
import os
import threading
from typing import Dict, List, Optional, Tuple
import pandas as pd

from .schema import RealDataMetadata, LeakageEventSummary

_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "real"))
_FLOWS_FILE = "2018_SCADA_Flows.csv"
_PRESSURES_FILE = "2018_SCADA_Pressures.csv"
_LEAKAGES_FILE = "2018_Leakages.csv"

_LOCK = threading.RLock()
_CACHED_FLOWS: Optional[pd.DataFrame] = None
_CACHED_PRESSURES: Optional[pd.DataFrame] = None
_CACHED_LEAKAGES: Optional[pd.DataFrame] = None
_CACHED_METADATA: Optional[RealDataMetadata] = None
_CACHED_EVENTS: Optional[List[LeakageEventSummary]] = None


def get_data_dir() -> str:
    """Return the absolute path to the real data directory."""
    return _DATA_DIR


def sniff_format(filepath: str) -> Tuple[str, str]:
    """Inspect CSV delimiter and decimal separator dynamically without loading full file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = [f.readline() for _ in range(100)]

    header = lines[0] if lines else ""

    # Determine column delimiter
    if ";" in header:
        sep = ";"
    elif "," in header:
        sep = ","
    elif "\t" in header:
        sep = "\t"
    else:
        sep = ","

    # Determine decimal separator
    decimal = "."
    if sep == ";":
        # Check tokens across sampled lines for comma as decimal
        for line in lines[1:]:
            tokens = line.strip().split(";")
            for tok in tokens[1:]:
                tok_clean = tok.strip().replace('"', '').replace("'", "")
                if "," in tok_clean and "." not in tok_clean:
                    decimal = ","
                    break
            if decimal == ",":
                break
        # If no decimals found in sampled rows (e.g. all 0s), default to ',' for BattLeDIM
        if decimal == ".":
            decimal = ","

    return sep, decimal


def _load_csv(filename: str) -> pd.DataFrame:
    path = os.path.join(_DATA_DIR, filename)
    sep, decimal = sniff_format(path)
    df = pd.read_csv(path, sep=sep, decimal=decimal)
    if "Timestamp" in df.columns:
        df["Timestamp"] = df["Timestamp"].astype(str)
    return df


def get_flows_df() -> pd.DataFrame:
    global _CACHED_FLOWS
    if _CACHED_FLOWS is None:
        with _LOCK:
            if _CACHED_FLOWS is None:
                _CACHED_FLOWS = _load_csv(_FLOWS_FILE)
    return _CACHED_FLOWS


def get_pressures_df() -> pd.DataFrame:
    global _CACHED_PRESSURES
    if _CACHED_PRESSURES is None:
        with _LOCK:
            if _CACHED_PRESSURES is None:
                _CACHED_PRESSURES = _load_csv(_PRESSURES_FILE)
    return _CACHED_PRESSURES


def get_leakages_df() -> pd.DataFrame:
    global _CACHED_LEAKAGES
    if _CACHED_LEAKAGES is None:
        with _LOCK:
            if _CACHED_LEAKAGES is None:
                _CACHED_LEAKAGES = _load_csv(_LEAKAGES_FILE)
    return _CACHED_LEAKAGES


def get_leakage_events() -> List[LeakageEventSummary]:
    """Identify and summarize all historical leakage episodes from ground-truth data."""
    global _CACHED_EVENTS
    if _CACHED_EVENTS is not None:
        return _CACHED_EVENTS

    with _LOCK:
        if _CACHED_EVENTS is not None:
            return _CACHED_EVENTS

        df = get_leakages_df()
        pipes = [c for c in df.columns if c != "Timestamp"]
        events: List[LeakageEventSummary] = []

        for p in pipes:
            active = df[df[p] > 0]
            if not active.empty:
                start_t = str(active["Timestamp"].iloc[0])
                end_t = str(active["Timestamp"].iloc[-1])
                max_rate = float(active[p].max())
                steps = len(active)
                # Each step is 5 minutes (5 / 60 hours)
                duration_hrs = round(steps * (5.0 / 60.0), 1)

                events.append(
                    LeakageEventSummary(
                        pipe=p,
                        start_time=start_t,
                        end_time=end_t,
                        duration_hours=duration_hrs,
                        max_rate=round(max_rate, 2),
                        active_steps=steps,
                    )
                )

        # Sort events chronologically by start_time
        events.sort(key=lambda x: x.start_time)
        _CACHED_EVENTS = events
        return _CACHED_EVENTS


def get_metadata() -> RealDataMetadata:
    """Generate comprehensive dataset metadata dynamically from inspected files."""
    global _CACHED_METADATA
    if _CACHED_METADATA is not None:
        return _CACHED_METADATA

    with _LOCK:
        if _CACHED_METADATA is not None:
            return _CACHED_METADATA

        flows_df = get_flows_df()
        press_df = get_pressures_df()
        leak_df = get_leakages_df()
        events = get_leakage_events()

        f_cols = [c for c in flows_df.columns if c != "Timestamp"]
        p_cols = [c for c in press_df.columns if c != "Timestamp"]
        l_cols = [c for c in leak_df.columns if c != "Timestamp"]

        start_time = str(flows_df["Timestamp"].iloc[0])
        end_time = str(flows_df["Timestamp"].iloc[-1])
        total_rows = len(flows_df)

        _CACHED_METADATA = RealDataMetadata(
            dataset="BattLeDIM 2018 L-Town Benchmark",
            description="Real SCADA flow, pressure, and ground-truth leakage data from the L-Town benchmark.",
            timestamp_start=start_time,
            timestamp_end=end_time,
            total_records=total_rows,
            interval_minutes=5,
            flow_sensors=f_cols,
            pressure_sensors=p_cols,
            leakage_pipes=l_cols,
            leakage_events_count=len(events),
            leakage_events=events,
        )
        return _CACHED_METADATA
