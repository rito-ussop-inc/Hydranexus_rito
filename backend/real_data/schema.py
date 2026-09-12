from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class LeakageEventSummary(BaseModel):
    pipe: str = Field(..., description="Pipe ID where leakage occurred, e.g. p31")
    start_time: str = Field(..., description="Timestamp when leak started")
    end_time: str = Field(..., description="Timestamp when leak resolved/ended")
    duration_hours: float = Field(..., description="Duration of leak in hours")
    max_rate: float = Field(..., description="Maximum leakage rate in m3/h")
    active_steps: int = Field(..., description="Total 5-minute time steps leak was active")


class RealDataMetadata(BaseModel):
    dataset: str = "BattLeDIM 2018 L-Town Benchmark"
    description: str = "Real SCADA flow, pressure, and ground-truth leakage data from the L-Town water distribution network."
    timestamp_start: str = "2018-01-01 00:00:00"
    timestamp_end: str = "2018-12-31 23:55:00"
    total_records: int = 105120
    interval_minutes: int = 5
    flow_sensors: List[str] = ["p227", "p235", "PUMP_1"]
    pressure_sensors: List[str] = []
    leakage_pipes: List[str] = []
    leakage_events_count: int = 14
    leakage_events: List[LeakageEventSummary] = []


class RealTelemetryPoint(BaseModel):
    time: str = Field(..., description="Timestamp string YYYY-MM-DD HH:MM:SS")
    flow: float = Field(..., description="Total network inflow (p227 + p235 + PUMP_1) in m3/h")
    pressure: float = Field(..., description="Average network pressure head in meters")
    consumption: float = Field(default=0.0, description="Estimated consumption or downstream draw in m3/h")
    pump_flow: float = Field(default=0.0, description="PUMP_1 flow rate in m3/h")
    flows: Dict[str, float] = Field(default_factory=dict, description="Raw sensor flow rates by pipe ID")
    pressures: Dict[str, float] = Field(default_factory=dict, description="Pressure readings by node ID")
    active_leaks: List[str] = Field(default_factory=list, description="Pipes with active leakage at this timestamp")
    leak_rate: float = Field(default=0.0, description="Total ground-truth leak rate in m3/h")
    anomalyScore: float = Field(default=0.0, description="Anomaly score based on deviations")


class RealTelemetryResponse(BaseModel):
    mode: str = "real"
    dataset: str = "BattLeDIM 2018 L-Town Benchmark"
    start: str
    end: str
    points: int
    downsampled: bool = False
    active_event: Optional[LeakageEventSummary] = None
    telemetry: List[RealTelemetryPoint]
