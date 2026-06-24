# Evaluation

Evaluation includes data quality, forecasting accuracy, and query latency.

## Data Quality

Run:

```bash
make dq
```

Checks:

- row count is positive
- required columns exist
- dropoff time is after pickup time
- fare, total amount, and distance are non-negative
- pickup and dropoff location IDs resolve to zones

## Forecasting

Run:

```bash
make evaluate
```

Metrics:

- MAE
- RMSE
- MAPE

## Query Latency

Run:

```bash
PYTHONPATH=src python -m nyc_taxi_mobility_analytics.benchmark
```

