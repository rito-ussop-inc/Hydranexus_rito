from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class TelemetryPoint(BaseModel):
    time: str
    flow: float
    pressure: float
    consumption: float
    level: Optional[float] = None
    eddy_current_variance: Optional[float] = Field(default=None, description="0.0 healthy pipe wall, 1.0 critical crack")
    anomalyScore: Optional[float] = 0.0


class DetectRequest(BaseModel):
    telemetry: List[TelemetryPoint]


class VerifyRequest(BaseModel):
    observed: List[TelemetryPoint]
    hypothesis: str = Field(default="leak", description="leak|burst|demand|sensor|normal")
    segment: str = Field(default="B2 → B3")


class WhatIfRequest(BaseModel):
    scenario: str = Field(default="isolate", description="isolate|reducePressure|bypassRoute|doNothing")
    valveThrottle: Optional[float] = Field(default=50, description="0..100, only for reducePressure")
    incident: Optional[str] = Field(default="leak", description="leak|burst|demand|sensor|normal")
    baselineLoss: Optional[float] = Field(default=None, description="current estimated loss L/hr from /api/ai/detect")


class DecisionCompareRequest(BaseModel):
    incident: Optional[str] = Field(default="leak", description="leak|burst|demand|sensor|corrosion|normal")
    severity: Optional[str] = Field(default="HIGH", description="HIGH|MEDIUM|LOW|NORMAL")
    segment: Optional[str] = Field(default="B2 → B3")
    baselineLoss: Optional[float] = Field(default=None, description="current estimated loss L/hr; inferred from incident type when omitted")
    valveThrottle: Optional[float] = Field(default=50, description="0..100, only for throttle/reducePressure")
    weights: Optional[dict] = Field(default=None, description="override trade-off weights {water,risk,service,cost,disruption}")
    costs: Optional[dict] = Field(default=None, description="override planning costs per action, e.g. {throttle: {cost_usd: 900}}")
