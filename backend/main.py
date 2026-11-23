"""Welcome back"""
from fastapi import FastAPI
from schemas import RiskRequest, RouteRequest, SimRequest

app = FastAPI(title="POLARIS API (demo mirror)", version="1.0.0")

@app.get("/api/v1/mission/status")
def status():
    return {"system": "ONLINE", "mode": "DEMO", "message": "Simulated data only"}

@app.get("/api/v1/sea-ice/current")
def ice_current():
    return {"t_hours": 0, "corridor_pct": 42, "note": "DEMO FORECAST"}

@app.get("/api/v1/sea-ice/forecast")
def ice_forecast():
    return {"steps": [0, 6, 12, 24, 48, 72], "corridor": [42, 45, 49, 58, 67, 72]}

@app.get("/api/v1/icebergs")
def icebergs():
    return {"icebergs": ["A-23", "B-17", "C-09", "D-41", "E-12"]}

@app.get("/api/v1/icebergs/{bid}")
def iceberg(bid: str):
    return {"id": bid, "note": "demo trajectory"}

@app.get("/api/v1/icebergs/{bid}/trajectory")
def traj(bid: str):
    return {"id": bid, "steps": [0, 12, 24, 48, 72]}

@app.get("/api/v1/weather")
def weather(lat: float = -58.0, lon: float = 50.0, t: float = 0.0):
    return {"lat": lat, "lon": lon, "t": t, "wind_kmh": 38, "waves_m": 3.2, "air_c": -12}

@app.post("/api/v1/risk/analyze")
def risk(r: RiskRequest):
    return {"lat": r.lat, "lon": r.lon, "t": r.t_hours, "score": 50, "level": "MODERATE"}

@app.post("/api/v1/routes/optimize")
def routes(r: RouteRequest):
    return {"routes": ["safe", "balanced", "fast"], "note": "demo mirror"}

@app.post("/api/v1/simulation/run")
def sim(r: SimRequest):
    return {"route": r.route_id, "hours": r.hours, "reroute_at": 48}

@app.get("/api/v1/analytics")
def analytics():
    return {"label": "PROTOTYPE / SIMULATION METRICS"}
