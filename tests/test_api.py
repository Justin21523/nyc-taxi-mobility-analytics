from fastapi.testclient import TestClient

from nyc_taxi_mobility_analytics.api import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analytics_endpoints():
    assert client.get("/analytics/overview").status_code == 200
    demand = client.get("/analytics/hourly-demand?limit=5")
    assert demand.status_code == 200
    assert len(demand.json()) == 5
    zones = client.get("/analytics/top-zones?kind=pickup&limit=3")
    assert zones.status_code == 200
    assert len(zones.json()) == 3
    routes = client.get("/analytics/routes?limit=3")
    assert routes.status_code == 200
    assert len(routes.json()) == 3


def test_forecast_and_sample_endpoints():
    forecast = client.get("/forecast/demand?horizon=6")
    assert forecast.status_code == 200
    assert len(forecast.json()) == 6
    metrics = client.get("/forecast/metrics")
    assert metrics.status_code == 200
    assert len(metrics.json()) == 3
    sample = client.get("/trips/sample?limit=4")
    assert sample.status_code == 200
    assert len(sample.json()) == 4


def test_new_analytics_and_trip_search_endpoints():
    for path in [
        "/analytics/od-matrix",
        "/analytics/airport-trips",
        "/analytics/fare-summary",
        "/analytics/tip-behavior",
        "/analytics/seasonality",
        "/analytics/peak-hours",
        "/zones",
        "/trips/search?limit=5&sort_by=total_amount&sort_dir=desc",
    ]:
        response = client.get(path)
        assert response.status_code == 200
