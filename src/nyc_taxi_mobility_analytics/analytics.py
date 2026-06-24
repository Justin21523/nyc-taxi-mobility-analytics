from typing import Any

import pandas as pd

from .warehouse import fetch_df

Filters = dict[str, Any]


def _where(filters: Filters | None = None) -> tuple[str, list[Any]]:
    filters = filters or {}
    clauses = []
    params: list[Any] = []
    if filters.get("start_date"):
        clauses.append("CAST(t.pickup_datetime AS DATE) >= ?")
        params.append(filters["start_date"])
    if filters.get("end_date"):
        clauses.append("CAST(t.pickup_datetime AS DATE) <= ?")
        params.append(filters["end_date"])
    if filters.get("pickup_borough") and filters["pickup_borough"] != "All":
        clauses.append("p.borough = ?")
        params.append(filters["pickup_borough"])
    if filters.get("dropoff_borough") and filters["dropoff_borough"] != "All":
        clauses.append("d.borough = ?")
        params.append(filters["dropoff_borough"])
    if filters.get("payment_type") and filters["payment_type"] != "All":
        clauses.append("t.payment_type = ?")
        params.append(filters["payment_type"])
    if filters.get("airport_only"):
        clauses.append("(p.service_zone = 'Airport' OR d.service_zone = 'Airport')")
    if filters.get("min_distance") is not None:
        clauses.append("t.trip_distance >= ?")
        params.append(float(filters["min_distance"]))
    return ("WHERE " + " AND ".join(clauses)) if clauses else "", params


def _filtered_from(filters: Filters | None = None) -> tuple[str, list[Any]]:
    where_sql, params = _where(filters)
    return (
        f"""
        FROM trips t
        JOIN zones p ON t.pickup_location_id = p.location_id
        JOIN zones d ON t.dropoff_location_id = d.location_id
        {where_sql}
        """,
        params,
    )


def filter_options() -> dict:
    boroughs = fetch_df(
        """
        SELECT borough
        FROM zones
        WHERE borough IS NOT NULL AND borough NOT IN ('Unknown', 'N/A')
        GROUP BY 1
        ORDER BY 1
        """
    )["borough"].tolist()
    payments = fetch_df("SELECT payment_type FROM trips GROUP BY 1 ORDER BY 1")["payment_type"].tolist()
    dates = fetch_df("SELECT min(CAST(pickup_datetime AS DATE)) AS min_date, max(CAST(pickup_datetime AS DATE)) AS max_date FROM trips")
    return {"boroughs": boroughs, "payment_types": payments, **dates.iloc[0].to_dict()}


def overview(filters: Filters | None = None) -> dict:
    from_sql, params = _filtered_from(filters)
    df = fetch_df(
        f"""
        SELECT count(*) AS trip_count,
               min(t.pickup_datetime) AS min_pickup,
               max(t.pickup_datetime) AS max_pickup,
               round(sum(t.total_amount), 2) AS total_revenue,
               round(avg(t.trip_distance), 2) AS avg_distance,
               round(avg(t.total_amount), 2) AS avg_total_amount,
               round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct,
               round(avg(date_diff('minute', t.pickup_datetime, t.dropoff_datetime)), 2) AS avg_duration_min,
               round(avg(CASE WHEN p.service_zone = 'Airport' OR d.service_zone = 'Airport' THEN 1 ELSE 0 END) * 100, 2) AS airport_trip_share_pct
        {from_sql}
        """,
        tuple(params),
    )
    return df.iloc[0].to_dict()


def hourly_demand(limit: int = 168, filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT date_trunc('hour', t.pickup_datetime) AS pickup_hour, count(*) AS trip_count
        {from_sql}
        GROUP BY 1
        ORDER BY 1
        LIMIT ?
        """,
        tuple(params + [limit]),
    )


def daily_revenue(filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT CAST(t.pickup_datetime AS DATE) AS trip_date,
               count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue,
               round(avg(t.total_amount), 2) AS avg_total_amount
        {from_sql}
        GROUP BY 1
        ORDER BY 1
        """,
        tuple(params),
    )


def top_zones(kind: str = "pickup", limit: int = 10, filters: Filters | None = None) -> pd.DataFrame:
    zone_alias = "p" if kind != "dropoff" else "d"
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT {zone_alias}.location_id, {zone_alias}.borough, {zone_alias}.zone, count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue
        {from_sql}
        GROUP BY 1, 2, 3
        ORDER BY trip_count DESC
        LIMIT ?
        """,
        tuple(params + [limit]),
    )


def routes(limit: int = 10, filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT p.zone AS pickup_zone, d.zone AS dropoff_zone,
               p.borough AS pickup_borough, d.borough AS dropoff_borough,
               count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue,
               round(avg(t.trip_distance), 2) AS avg_distance,
               round(avg(t.total_amount), 2) AS avg_total_amount
        {from_sql}
        GROUP BY 1, 2, 3, 4
        ORDER BY trip_count DESC
        LIMIT ?
        """,
        tuple(params + [limit]),
    )


def top_routes_by_revenue(limit: int = 10, filters: Filters | None = None) -> pd.DataFrame:
    result = routes(limit=1000, filters=filters)
    return result.sort_values("total_revenue", ascending=False).head(limit).reset_index(drop=True)


def fare_distribution(limit: int = 250, filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT t.fare_amount, t.tip_amount, t.total_amount, t.trip_distance,
               CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END AS tip_rate,
               CASE WHEN t.trip_distance > 0 THEN t.total_amount / t.trip_distance ELSE NULL END AS amount_per_mile,
               CASE
                   WHEN t.trip_distance < 1 THEN '0-1 mi'
                   WHEN t.trip_distance < 3 THEN '1-3 mi'
                   WHEN t.trip_distance < 6 THEN '3-6 mi'
                   WHEN t.trip_distance < 10 THEN '6-10 mi'
                   ELSE '10+ mi'
               END AS distance_bucket
        {from_sql}
        ORDER BY t.total_amount DESC
        LIMIT ?
        """,
        tuple(params + [limit]),
    )


def fare_summary(filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT p.borough AS pickup_borough,
               count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue,
               round(avg(t.total_amount), 2) AS avg_total_amount,
               round(avg(CASE WHEN t.trip_distance > 0 THEN t.total_amount / t.trip_distance ELSE NULL END), 2) AS avg_amount_per_mile
        {from_sql}
        GROUP BY 1
        ORDER BY total_revenue DESC
        """,
        tuple(params),
    )


def tip_behavior(filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT t.payment_type,
               count(*) AS trip_count,
               round(avg(t.tip_amount), 2) AS avg_tip_amount,
               round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct,
               round(sum(t.tip_amount), 2) AS total_tips
        {from_sql}
        GROUP BY 1
        ORDER BY trip_count DESC
        """,
        tuple(params),
    )


def tip_by_distance_bucket(filters: Filters | None = None) -> pd.DataFrame:
    fares = fare_distribution(limit=100000, filters=filters)
    if fares.empty:
        return fares
    return (
        fares.groupby("distance_bucket", as_index=False)
        .agg(trip_count=("total_amount", "size"), avg_tip_rate_pct=("tip_rate", lambda s: round(float(s.mean() * 100), 2)))
        .sort_values("distance_bucket")
    )


def weekday_hour_seasonality(filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT dayname(t.pickup_datetime) AS weekday,
               extract('dow' FROM t.pickup_datetime) AS weekday_num,
               extract('hour' FROM t.pickup_datetime) AS pickup_hour,
               count(*) AS trip_count
        {from_sql}
        GROUP BY 1, 2, 3
        ORDER BY 2, 3
        """,
        tuple(params),
    )


def peak_hour_summary(filters: Filters | None = None) -> dict:
    demand = hourly_demand(limit=100000, filters=filters)
    if demand.empty:
        return {}
    demand["hour_of_day"] = pd.to_datetime(demand["pickup_hour"]).dt.hour
    by_hour = demand.groupby("hour_of_day", as_index=False)["trip_count"].mean()
    busiest = by_hour.loc[by_hour["trip_count"].idxmax()]
    slowest = by_hour.loc[by_hour["trip_count"].idxmin()]
    rolling = demand["trip_count"].rolling(window=24, min_periods=6)
    demand["rolling_mean"] = rolling.mean()
    demand["rolling_std"] = rolling.std().fillna(0)
    demand["is_anomaly"] = (demand["trip_count"] - demand["rolling_mean"]).abs() > (2 * demand["rolling_std"])
    peak_ratio = float(busiest["trip_count"] / slowest["trip_count"]) if slowest["trip_count"] else None
    return {
        "busiest_hour": int(busiest["hour_of_day"]),
        "busiest_hour_avg_trips": round(float(busiest["trip_count"]), 2),
        "slowest_hour": int(slowest["hour_of_day"]),
        "slowest_hour_avg_trips": round(float(slowest["trip_count"]), 2),
        "peak_offpeak_ratio": round(peak_ratio, 2) if peak_ratio else None,
        "anomaly_count": int(demand["is_anomaly"].sum()),
    }


def demand_anomalies(filters: Filters | None = None) -> pd.DataFrame:
    demand = hourly_demand(limit=100000, filters=filters)
    if demand.empty:
        return demand
    demand["rolling_mean"] = demand["trip_count"].rolling(window=24, min_periods=6).mean()
    demand["rolling_std"] = demand["trip_count"].rolling(window=24, min_periods=6).std().fillna(0)
    demand["upper_band"] = demand["rolling_mean"] + 2 * demand["rolling_std"]
    demand["lower_band"] = (demand["rolling_mean"] - 2 * demand["rolling_std"]).clip(lower=0)
    demand["is_anomaly"] = (demand["trip_count"] > demand["upper_band"]) | (demand["trip_count"] < demand["lower_band"])
    return demand


def borough_od_matrix(filters: Filters | None = None) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    return fetch_df(
        f"""
        SELECT p.borough AS pickup_borough,
               d.borough AS dropoff_borough,
               count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue
        {from_sql}
        GROUP BY 1, 2
        ORDER BY trip_count DESC
        """,
        tuple(params),
    )


def zone_od_matrix(limit: int = 25, filters: Filters | None = None) -> pd.DataFrame:
    return routes(limit=limit, filters=filters)


def airport_trips(filters: Filters | None = None) -> pd.DataFrame:
    airport_filters = dict(filters or {})
    airport_filters["airport_only"] = True
    from_sql, params = _filtered_from(airport_filters)
    return fetch_df(
        f"""
        SELECT count(*) AS airport_trip_count,
               round(sum(t.total_amount), 2) AS total_revenue,
               round(avg(t.total_amount), 2) AS avg_total_amount,
               round(avg(t.trip_distance), 2) AS avg_distance,
               round(avg(CASE WHEN p.service_zone = 'Airport' THEN 1 ELSE 0 END) * 100, 2) AS outbound_airport_share_pct
        {from_sql}
        """,
        tuple(params),
    )


def zone_map_metrics(kind: str = "pickup", filters: Filters | None = None) -> pd.DataFrame:
    return top_zones(kind=kind, limit=500, filters=filters)


def sample_trips(limit: int = 20) -> pd.DataFrame:
    return search_trips(limit=limit)


def search_trips(
    limit: int = 100,
    filters: Filters | None = None,
    pickup_zone: str | None = None,
    dropoff_zone: str | None = None,
    min_fare: float | None = None,
    max_fare: float | None = None,
    sort_by: str = "pickup_datetime",
    sort_dir: str = "desc",
) -> pd.DataFrame:
    from_sql, params = _filtered_from(filters)
    extra = []
    if pickup_zone and pickup_zone != "All":
        extra.append("p.zone = ?")
        params.append(pickup_zone)
    if dropoff_zone and dropoff_zone != "All":
        extra.append("d.zone = ?")
        params.append(dropoff_zone)
    if min_fare is not None:
        extra.append("t.total_amount >= ?")
        params.append(float(min_fare))
    if max_fare is not None:
        extra.append("t.total_amount <= ?")
        params.append(float(max_fare))
    if extra:
        connector = " AND " if "WHERE" in from_sql else " WHERE "
        from_sql = from_sql + connector + " AND ".join(extra)
    sort_columns = {
        "pickup_datetime": "t.pickup_datetime",
        "total_amount": "t.total_amount",
        "trip_distance": "t.trip_distance",
        "tip_amount": "t.tip_amount",
    }
    sort_sql = sort_columns.get(sort_by, "t.pickup_datetime")
    direction = "ASC" if sort_dir.lower() == "asc" else "DESC"
    return fetch_df(
        f"""
        SELECT t.trip_id, t.pickup_datetime, t.dropoff_datetime,
               p.zone AS pickup_zone, d.zone AS dropoff_zone,
               p.borough AS pickup_borough, d.borough AS dropoff_borough,
               t.passenger_count, t.trip_distance, t.fare_amount, t.tip_amount,
               t.total_amount, t.payment_type,
               date_diff('minute', t.pickup_datetime, t.dropoff_datetime) AS duration_min
        {from_sql}
        ORDER BY {sort_sql} {direction}
        LIMIT ?
        """,
        tuple(params + [limit]),
    )


def zone_names() -> list[str]:
    return fetch_df("SELECT zone FROM zones WHERE zone IS NOT NULL ORDER BY zone")["zone"].tolist()
