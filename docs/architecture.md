# Architecture

The platform uses a local data lakehouse-style layout:

1. Sample or TLC Parquet files are loaded by the ETL.
2. Trips are normalized into a common schema.
3. Trips are written to a Hive-style partitioned Parquet warehouse by `year` and `month`.
4. DuckDB reads partitioned Parquet and materializes analytical tables.
5. FastAPI and Streamlit query DuckDB through shared analytics functions.

Core layers:

- Ingestion: `sample_data.py`, `etl.py`
- Storage: `data/warehouse/trips/year=YYYY/month=MM`
- Query engine: DuckDB database in `data/duckdb`
- Analytics: `analytics.py`
- Quality and evaluation: `quality.py`, `evaluation.py`, `benchmark.py`
- Serving: `api.py`, `dashboard.py`

