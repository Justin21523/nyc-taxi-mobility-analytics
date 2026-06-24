import numpy as np
import pandas as pd

from .config import TRIPS_SAMPLE_PATH, ZONES_SAMPLE_PATH, ensure_dirs


ZONE_ROWS = [
    (1, "EWR", "Newark Airport", "Airport"),
    (2, "Queens", "JFK Airport", "Airport"),
    (3, "Queens", "LaGuardia Airport", "Airport"),
    (4, "Manhattan", "Midtown Center", "Business"),
    (5, "Manhattan", "Financial District", "Business"),
    (6, "Brooklyn", "Williamsburg", "Residential"),
    (7, "Queens", "Long Island City", "Residential"),
    (8, "Bronx", "Mott Haven", "Residential"),
]


def generate_sample_trips(row_count: int = 2000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    hour_offsets = rng.integers(0, 24 * 30, size=row_count)
    minute_offsets = rng.integers(0, 60, size=row_count)
    pickup_times = pd.Timestamp("2024-01-01") + pd.to_timedelta(hour_offsets, unit="h") + pd.to_timedelta(minute_offsets, unit="m")
    pickup_times = pd.Series(pickup_times).sort_values(ignore_index=True)
    durations = rng.integers(5, 75, size=row_count)
    pickup_zones = rng.choice([1, 2, 3, 4, 5, 6, 7, 8], size=row_count, p=[0.04, 0.09, 0.08, 0.32, 0.18, 0.12, 0.11, 0.06])
    dropoff_zones = rng.choice([1, 2, 3, 4, 5, 6, 7, 8], size=row_count, p=[0.03, 0.08, 0.08, 0.30, 0.20, 0.13, 0.12, 0.06])
    trip_distance = np.round(rng.gamma(shape=2.2, scale=1.8, size=row_count) + 0.4, 2)
    passenger_count = rng.integers(1, 5, size=row_count)
    fare_amount = np.round(4.0 + trip_distance * rng.uniform(2.2, 4.1, size=row_count) + durations * 0.18, 2)
    tip_amount = np.round(fare_amount * rng.choice([0.0, 0.12, 0.18, 0.22], size=row_count, p=[0.18, 0.22, 0.38, 0.22]), 2)
    tolls_amount = np.where((pickup_zones <= 3) | (dropoff_zones <= 3), rng.choice([0.0, 6.55], size=row_count, p=[0.65, 0.35]), 0.0)
    total_amount = np.round(fare_amount + tip_amount + tolls_amount + 1.3, 2)

    return pd.DataFrame(
        {
            "trip_id": np.arange(1, row_count + 1),
            "vendor_id": rng.choice([1, 2], size=row_count),
            "pickup_datetime": pickup_times.to_numpy(),
            "dropoff_datetime": (pickup_times + pd.to_timedelta(durations, unit="m")).to_numpy(),
            "passenger_count": passenger_count,
            "trip_distance": trip_distance,
            "pickup_location_id": pickup_zones,
            "dropoff_location_id": dropoff_zones,
            "fare_amount": fare_amount,
            "tip_amount": tip_amount,
            "tolls_amount": tolls_amount,
            "total_amount": total_amount,
            "payment_type": rng.choice(["card", "cash"], size=row_count, p=[0.78, 0.22]),
        }
    )


def generate_zones() -> pd.DataFrame:
    return pd.DataFrame(ZONE_ROWS, columns=["location_id", "borough", "zone", "service_zone"])


def main() -> None:
    ensure_dirs()
    generate_sample_trips().to_parquet(TRIPS_SAMPLE_PATH, index=False)
    generate_zones().to_parquet(ZONES_SAMPLE_PATH, index=False)
    print(f"Wrote {TRIPS_SAMPLE_PATH}")
    print(f"Wrote {ZONES_SAMPLE_PATH}")


if __name__ == "__main__":
    main()
