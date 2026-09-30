from pydantic import BaseModel
from typing import List, Optional

class LatLon(BaseModel):
    lat: float
    lon: float

class RiskRequest(BaseModel):
    lat: float
    lon: float
    t_hours: float = 0.0

class RouteRequest(BaseModel):
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    t0: float = 0.0

class SimRequest(BaseModel):
    route_id: str = "fast"
    hours: int = 48
