# Data Card

## Dataset

Primary dataset: NYC TLC Taxi Trip Records Parquet.

The repository does not include large public Parquet files. It includes a deterministic sample generator that creates TLC-like local data for development, tests, and demos.

Real data can be downloaded with:

```bash
make download-real-data YEAR=2024 MONTH=01 TAXI_TYPE=yellow
```

The default real-data smoke test uses Yellow Taxi January 2024 and stores it under `data/raw/`, which is intentionally excluded from Git.

## Key Fields

- `pickup_datetime`
- `dropoff_datetime`
- `passenger_count`
- `trip_distance`
- `pickup_location_id`
- `dropoff_location_id`
- `fare_amount`
- `tip_amount`
- `tolls_amount`
- `total_amount`
- `payment_type`
- optional TLC surcharge fields such as `congestion_surcharge`, `airport_fee`, and `cbd_congestion_fee`

## Limitations

The generated sample data is synthetic and intended for pipeline validation. It should not be used for real mobility policy decisions.
