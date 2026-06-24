from typing import Annotated

from fastapi import FastAPI, Query

from .analytics import (
    airport_trips,
    borough_od_matrix,
    fare_summary,
    hourly_demand,
    overview,
    peak_hour_summary,
    routes,
    sample_trips,
    search_trips,
    tip_behavior,
    top_zones,
    weekday_hour_seasonality,
    zone_names,
)
from .config import DB_PATH
from .etl import run_etl
from .forecast import forecast_metrics, make_forecast

app = FastAPI(title="NYC Taxi Mobility Analytics Platform")


def ensure_ready() -> None:
    if not DB_PATH.exists():
        run_etl()


def records(df):
    return df.to_dict(orient="records")


def request_filters(
    start_date: str | None = None,
    end_date: str | None = None,
    pickup_borough: str | None = None,
    dropoff_borough: str | None = None,
    payment_type: str | None = None,
    airport_only: bool = False,
    min_distance: float | None = None,
) -> dict:
    return {
        "start_date": start_date,
        "end_date": end_date,
        "pickup_borough": pickup_borough,
        "dropoff_borough": dropoff_borough,
        "payment_type": payment_type,
        "airport_only": airport_only,
        "min_distance": min_distance,
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "database_exists": DB_PATH.exists()}


@app.get("/analytics/overview")
def analytics_overview(
    start_date: str | None = None,
    end_date: str | None = None,
    pickup_borough: str | None = None,
    dropoff_borough: str | None = None,
    payment_type: str | None = None,
    airport_only: bool = False,
    min_distance: float | None = None,
) -> dict:
    ensure_ready()
    return overview(request_filters(start_date, end_date, pickup_borough, dropoff_borough, payment_type, airport_only, min_distance))


@app.get("/analytics/hourly-demand")
def analytics_hourly_demand(
    limit: int = Query(168, ge=1, le=5000),
    start_date: str | None = None,
    end_date: str | None = None,
    pickup_borough: str | None = None,
    dropoff_borough: str | None = None,
    payment_type: str | None = None,
    airport_only: bool = False,
    min_distance: float | None = None,
) -> list[dict]:
    ensure_ready()
    filters = request_filters(start_date, end_date, pickup_borough, dropoff_borough, payment_type, airport_only, min_distance)
    return records(hourly_demand(limit=limit, filters=filters))


@app.get("/analytics/top-zones")
def analytics_top_zones(
    kind: str = Query("pickup", pattern="^(pickup|dropoff)$"),
    limit: int = Query(10, ge=1, le=500),
) -> list[dict]:
    ensure_ready()
    return records(top_zones(kind=kind, limit=limit))


@app.get("/analytics/routes")
def analytics_routes(limit: int = Query(10, ge=1, le=500)) -> list[dict]:
    ensure_ready()
    return records(routes(limit=limit))


@app.get("/analytics/od-matrix")
def analytics_od_matrix() -> list[dict]:
    ensure_ready()
    return records(borough_od_matrix())


@app.get("/analytics/airport-trips")
def analytics_airport_trips() -> list[dict]:
    ensure_ready()
    return records(airport_trips())


@app.get("/analytics/fare-summary")
def analytics_fare_summary() -> list[dict]:
    ensure_ready()
    return records(fare_summary())


@app.get("/analytics/tip-behavior")
def analytics_tip_behavior() -> list[dict]:
    ensure_ready()
    return records(tip_behavior())


@app.get("/analytics/seasonality")
def analytics_seasonality() -> list[dict]:
    ensure_ready()
    return records(weekday_hour_seasonality())


@app.get("/analytics/peak-hours")
def analytics_peak_hours() -> dict:
    ensure_ready()
    return peak_hour_summary()


@app.get("/forecast/demand")
def forecast_demand(horizon: int = Query(24, ge=1, le=168), window: int = Query(24, ge=2, le=168)) -> list[dict]:
    ensure_ready()
    return records(make_forecast(window=window, horizon=horizon).tail(horizon))


@app.get("/forecast/metrics")
def forecast_metric_endpoint(window: int = Query(24, ge=2, le=168)) -> list[dict]:
    ensure_ready()
    return records(forecast_metrics(make_forecast(window=window)))


@app.get("/zones")
def zones() -> list[str]:
    ensure_ready()
    return zone_names()


@app.get("/trips/sample")
def trips_sample(limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    ensure_ready()
    return records(sample_trips(limit=limit))


@app.get("/trips/search")
def trips_search(
    limit: int = Query(50, ge=1, le=500),
    pickup_zone: str | None = None,
    dropoff_zone: str | None = None,
    min_fare: float | None = None,
    max_fare: float | None = None,
    sort_by: Annotated[str, Query(pattern="^(pickup_datetime|total_amount|trip_distance|tip_amount)$")] = "pickup_datetime",
    sort_dir: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> list[dict]:
    ensure_ready()
    return records(search_trips(limit=limit, pickup_zone=pickup_zone, dropoff_zone=dropoff_zone, min_fare=min_fare, max_fare=max_fare, sort_by=sort_by, sort_dir=sort_dir))

