from nyc_taxi_mobility_analytics.analytics import (
    borough_od_matrix,
    daily_revenue,
    demand_anomalies,
    fare_summary,
    filter_options,
    hourly_demand,
    peak_hour_summary,
    routes,
    search_trips,
    tip_behavior,
    tip_by_distance_bucket,
    top_routes_by_revenue,
    top_zones,
    weekday_hour_seasonality,
    zone_map_metrics,
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


def test_filter_options_and_filtered_kpis():
    options = filter_options()
    assert options["min_date"] is not None
    filtered = hourly_demand(filters={"pickup_borough": "Manhattan"})
    assert not filtered.empty


def test_demand_and_fare_feature_outputs():
    peak = peak_hour_summary()
    assert "busiest_hour" in peak
    anomalies = demand_anomalies()
    assert {"rolling_mean", "upper_band", "lower_band", "is_anomaly"}.issubset(anomalies.columns)
    assert not fare_summary().empty
    assert not tip_by_distance_bucket().empty


def test_trip_explorer_and_zone_map_metrics():
    trips = search_trips(limit=5, sort_by="total_amount", sort_dir="desc")
    assert len(trips) == 5
    assert {"pickup_zone", "dropoff_zone", "duration_min"}.issubset(trips.columns)
    assert not zone_map_metrics("pickup").empty
