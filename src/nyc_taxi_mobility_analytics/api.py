from fastapi import FastAPI, Query

from .analytics import hourly_demand, overview, routes, sample_trips, top_zones
from .config import DB_PATH
from .etl import run_etl
from .forecast import make_forecast

app = FastAPI(title="NYC Taxi Mobility Analytics Platform")


def ensure_ready() -> None:
    if not DB_PATH.exists():
        run_etl()


def records(df):
    return df.to_dict(orient="records")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "database_exists": DB_PATH.exists()}


@app.get("/analytics/overview")
def analytics_overview() -> dict:
    ensure_ready()
    return overview()


@app.get("/analytics/hourly-demand")
def analytics_hourly_demand(limit: int = Query(168, ge=1, le=1000)) -> list[dict]:
    ensure_ready()
    return records(hourly_demand(limit=limit))


@app.get("/analytics/top-zones")
def analytics_top_zones(kind: str = Query("pickup", pattern="^(pickup|dropoff)$"), limit: int = Query(10, ge=1, le=100)) -> list[dict]:
    ensure_ready()
    return records(top_zones(kind=kind, limit=limit))


@app.get("/analytics/routes")
def analytics_routes(limit: int = Query(10, ge=1, le=100)) -> list[dict]:
    ensure_ready()
    return records(routes(limit=limit))


@app.get("/forecast/demand")
def forecast_demand(horizon: int = Query(24, ge=1, le=168)) -> list[dict]:
    ensure_ready()
    return records(make_forecast(horizon=horizon).tail(horizon))


@app.get("/trips/sample")
def trips_sample(limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    ensure_ready()
    return records(sample_trips(limit=limit))

