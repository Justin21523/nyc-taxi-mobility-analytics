# Architecture

The platform uses a local data lakehouse-style layout:

1. Sample or TLC Parquet files are loaded by the ETL.
2. Trips are normalized into a common schema.
3. Trips are written to a Hive-style partitioned Parquet warehouse by `year` and `month`.
4. DuckDB reads partitioned Parquet and materializes analytical tables.
5. Next.js App Router pages and Route Handlers query DuckDB through shared server-side query functions.

Core layers:

- Ingestion: `sample_data.py`, `etl.py`
- Storage: `data/warehouse/trips/year=YYYY/month=MM`
- Query engine: DuckDB over partitioned Parquet and `data/duckdb`
- Analytics: Python pipeline modules plus Next.js server query functions
- Quality and evaluation: `quality.py`, `evaluation.py`, `benchmark.py`
- Serving: Next.js pages in `app/` and Route Handlers under `/analytics`, `/forecast`, `/trips`, and `/zones`
