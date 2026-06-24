import pandas as pd

from .warehouse import fetch_df


def overview() -> dict:
    df = fetch_df(
        """
        SELECT count(*) AS trip_count,
               min(pickup_datetime) AS min_pickup,
               max(pickup_datetime) AS max_pickup,
               round(sum(total_amount), 2) AS total_revenue,
               round(avg(trip_distance), 2) AS avg_distance,
               round(avg(total_amount), 2) AS avg_total_amount
        FROM trips
        """
    )
    return df.iloc[0].to_dict()


def hourly_demand(limit: int = 168) -> pd.DataFrame:
    return fetch_df(
        """
        SELECT pickup_hour, trip_count
        FROM hourly_demand
        ORDER BY pickup_hour
        LIMIT ?
        """,
        (limit,),
    )


def daily_revenue() -> pd.DataFrame:
    return fetch_df("SELECT * FROM daily_revenue ORDER BY trip_date")


def top_zones(kind: str = "pickup", limit: int = 10) -> pd.DataFrame:
    column = "pickup_location_id" if kind != "dropoff" else "dropoff_location_id"
    return fetch_df(
        f"""
        SELECT z.borough, z.zone, count(*) AS trip_count
        FROM trips t
        JOIN zones z ON t.{column} = z.location_id
        GROUP BY 1, 2
        ORDER BY trip_count DESC
        LIMIT ?
        """,
        (limit,),
    )


def routes(limit: int = 10) -> pd.DataFrame:
    return fetch_df(
        """
        SELECT p.zone AS pickup_zone, d.zone AS dropoff_zone, r.trip_count,
               r.total_revenue, r.avg_distance, r.avg_total_amount
        FROM route_summary r
        JOIN zones p ON r.pickup_location_id = p.location_id
        JOIN zones d ON r.dropoff_location_id = d.location_id
        ORDER BY r.trip_count DESC
        LIMIT ?
        """,
        (limit,),
    )


def top_routes_by_revenue(limit: int = 10) -> pd.DataFrame:
    return fetch_df(
        """
        SELECT p.zone AS pickup_zone, d.zone AS dropoff_zone, r.trip_count,
               r.total_revenue, r.avg_distance, r.avg_total_amount
        FROM route_summary r
        JOIN zones p ON r.pickup_location_id = p.location_id
        JOIN zones d ON r.dropoff_location_id = d.location_id
        ORDER BY r.total_revenue DESC
        LIMIT ?
        """,
        (limit,),
    )


def fare_distribution() -> pd.DataFrame:
    return fetch_df(
        """
        SELECT fare_amount, tip_amount, total_amount, trip_distance, tip_rate, amount_per_mile
        FROM fare_features
        ORDER BY total_amount DESC
        LIMIT 250
        """
    )


def tip_behavior() -> pd.DataFrame:
    return fetch_df(
        """
        SELECT payment_type,
               count(*) AS trip_count,
               round(avg(f.tip_amount), 2) AS avg_tip_amount,
               round(avg(tip_rate) * 100, 2) AS avg_tip_rate_pct,
               round(sum(f.tip_amount), 2) AS total_tips
        FROM fare_features f
        JOIN trips t USING (trip_id)
        GROUP BY 1
        ORDER BY trip_count DESC
        """
    )


def weekday_hour_seasonality() -> pd.DataFrame:
    return fetch_df(
        """
        SELECT dayname(pickup_datetime) AS weekday,
               extract('hour' FROM pickup_datetime) AS pickup_hour,
               count(*) AS trip_count
        FROM trips
        GROUP BY 1, 2
        ORDER BY 1, 2
        """
    )


def borough_od_matrix() -> pd.DataFrame:
    return fetch_df(
        """
        SELECT p.borough AS pickup_borough,
               d.borough AS dropoff_borough,
               count(*) AS trip_count,
               round(sum(t.total_amount), 2) AS total_revenue
        FROM trips t
        JOIN zones p ON t.pickup_location_id = p.location_id
        JOIN zones d ON t.dropoff_location_id = d.location_id
        GROUP BY 1, 2
        ORDER BY trip_count DESC
        """
    )


def airport_trips() -> pd.DataFrame:
    return fetch_df(
        """
        SELECT count(*) AS airport_trip_count,
               round(avg(total_amount), 2) AS avg_total_amount
        FROM trips t
        JOIN zones p ON t.pickup_location_id = p.location_id
        JOIN zones d ON t.dropoff_location_id = d.location_id
        WHERE p.service_zone = 'Airport' OR d.service_zone = 'Airport'
        """
    )


def sample_trips(limit: int = 20) -> pd.DataFrame:
    return fetch_df("SELECT * FROM trips ORDER BY pickup_datetime LIMIT ?", (limit,))
