from nyc_taxi_mobility_analytics.analytics import (
    borough_od_matrix,
    daily_revenue,
    hourly_demand,
    routes,
    tip_behavior,
    top_routes_by_revenue,
    top_zones,
    weekday_hour_seasonality,
)


def test_hourly_demand_has_counts():
    result = hourly_demand()
    assert not result.empty
    assert {"pickup_hour", "trip_count"}.issubset(result.columns)
    assert result["trip_count"].sum() > 0


def test_daily_revenue_has_revenue():
    result = daily_revenue()
    assert not result.empty
    assert {"trip_date", "trip_count", "total_revenue"}.issubset(result.columns)
    assert result["total_revenue"].sum() > 0


def test_zone_and_route_outputs():
    assert not top_zones("pickup", 5).empty
    route_df = routes(5)
    assert not route_df.empty
    assert {"pickup_zone", "dropoff_zone", "trip_count"}.issubset(route_df.columns)


def test_advanced_analytics_outputs():
    assert not top_routes_by_revenue(5).empty
    assert not tip_behavior().empty
    assert not weekday_hour_seasonality().empty
    od = borough_od_matrix()
    assert not od.empty
    assert {"pickup_borough", "dropoff_borough", "trip_count", "total_revenue"}.issubset(od.columns)
