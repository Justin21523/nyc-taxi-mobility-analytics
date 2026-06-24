# Demo Script

1. Install dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

2. Generate sample Parquet:

   ```bash
   make sample-data
   ```

3. Build partitioned warehouse and DuckDB analytical tables:

   ```bash
   make etl
   ```

4. Run quality and evaluation:

   ```bash
   make dq
   make evaluate
   ```

5. Generate README demo assets:

   ```bash
   make demo-assets
   ```

6. Run the real NYC TLC smoke test:

   ```bash
   make real-smoke
   ```

7. Start API:

   ```bash
   make api
   ```

8. Start dashboard:

   ```bash
   make app
   ```

9. Explain resume value: Parquet ingestion, partitioned storage, DuckDB OLAP, data quality, forecasting baseline, API, and dashboard.
