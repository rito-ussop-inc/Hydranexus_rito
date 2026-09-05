from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class TelemetryPoint(BaseModel):
    time: str
    flow: float
    pressure: float
    consumption: float
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
