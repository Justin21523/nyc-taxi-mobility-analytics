# Demo Script

1. Install dependencies:

   ```bash
   python -m pip install -r requirements.txt
   npm install
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

7. Start the Next.js app and API:

   ```bash
   make app
   ```

8. Open `http://localhost:3000`.

9. Walk through dashboard pages:

   - Overview: filterable KPI cards and daily trend
   - Demand: weekday/hour heatmap, peak/off-peak analysis, anomaly baseline
   - Zones & routes: pickup/dropoff rankings, borough OD matrix, route matrix
   - Fares & tips: fare distribution, tip behavior, revenue by route
   - Trip Explorer: sortable trip-level query interface
   - Forecast Lab: naive, moving average, seasonal naive comparison
   - Zone Map: NYC taxi zone GeoJSON choropleth

10. Explain resume value: Parquet ingestion, partitioned storage, DuckDB OLAP, data quality, forecasting baseline, Next.js Route Handlers, and dashboard.
