import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import { filteredFrom, Filters } from "./filters";
import { queryOne, queryRows, warehouseReady } from "./duckdb";
import { ZONES_GEOJSON_PATH } from "./paths";

export type Row = Record<string, unknown>;

export async function health() {
  return { status: "ok", warehouseReady: warehouseReady() };
}

export async function filterOptions() {
  const boroughs = await queryRows<{ borough: string }>(`
    SELECT borough
    FROM zones
    WHERE borough IS NOT NULL AND borough NOT IN ('Unknown', 'N/A')
    GROUP BY 1
    ORDER BY 1
  `);
  const paymentTypes = await queryRows<{ payment_type: string }>("SELECT CAST(payment_type AS VARCHAR) AS payment_type FROM trips GROUP BY 1 ORDER BY 1");
  const dates = await queryOne<{ min_date: string; max_date: string }>(
    "SELECT min(CAST(pickup_datetime AS DATE)) AS min_date, max(CAST(pickup_datetime AS DATE)) AS max_date FROM trips",
  );
  return {
    boroughs: boroughs.map((row) => row.borough),
    paymentTypes: paymentTypes.map((row) => row.payment_type),
    minDate: dates.min_date,
    maxDate: dates.max_date,
  };
}

export async function overview(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryOne(
    `
    SELECT count(*) AS trip_count,
           min(t.pickup_datetime) AS min_pickup,
           max(t.pickup_datetime) AS max_pickup,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.trip_distance), 2) AS avg_distance,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct,
           round(avg(date_diff('minute', t.pickup_datetime, t.dropoff_datetime)), 2) AS avg_duration_min,
           round(avg(CASE WHEN p.service_zone = 'Airport' OR d.service_zone = 'Airport' THEN 1 ELSE 0 END) * 100, 2) AS airport_trip_share_pct
    ${fromSql}
    `,
    params,
  );
}

export async function hourlyDemand(filters: Filters, limit = 168) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT date_trunc('hour', t.pickup_datetime) AS pickup_hour, count(*) AS trip_count
    ${fromSql}
    GROUP BY 1
    ORDER BY 1
    LIMIT $limit
    `,
    { ...params, limit },
  );
}

export async function dailyRevenue(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT CAST(t.pickup_datetime AS DATE) AS trip_date,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount
    ${fromSql}
    GROUP BY 1
    ORDER BY 1
    `,
    params,
  );
}

export async function topZones(filters: Filters, kind = "pickup", limit = 10) {
  const zoneAlias = kind === "dropoff" ? "d" : "p";
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT ${zoneAlias}.location_id, ${zoneAlias}.borough, ${zoneAlias}.zone,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue
    ${fromSql}
    GROUP BY 1, 2, 3
    ORDER BY trip_count DESC
    LIMIT $limit
    `,
    { ...params, limit },
  );
}

export async function routes(filters: Filters, limit = 10, orderBy: "trip_count" | "total_revenue" = "trip_count") {
  const { fromSql, params } = filteredFrom(filters);
  const orderSql = orderBy === "total_revenue" ? "total_revenue" : "trip_count";
  return queryRows(
    `
    SELECT p.zone AS pickup_zone, d.zone AS dropoff_zone,
           p.borough AS pickup_borough, d.borough AS dropoff_borough,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.trip_distance), 2) AS avg_distance,
           round(avg(t.total_amount), 2) AS avg_total_amount
    ${fromSql}
    GROUP BY 1, 2, 3, 4
    ORDER BY ${orderSql} DESC
    LIMIT $limit
    `,
    { ...params, limit },
  );
}

export async function fareDistribution(filters: Filters, limit = 1000) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
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
    ${fromSql}
    ORDER BY t.total_amount DESC
    LIMIT $limit
    `,
    { ...params, limit },
  );
}

export async function fareSummary(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT p.borough AS pickup_borough,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(CASE WHEN t.trip_distance > 0 THEN t.total_amount / t.trip_distance ELSE NULL END), 2) AS avg_amount_per_mile
    ${fromSql}
    GROUP BY 1
    ORDER BY total_revenue DESC
    `,
    params,
  );
}

export async function tipBehavior(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT CAST(t.payment_type AS VARCHAR) AS payment_type,
           count(*) AS trip_count,
           round(avg(t.tip_amount), 2) AS avg_tip_amount,
           round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct,
           round(sum(t.tip_amount), 2) AS total_tips
    ${fromSql}
    GROUP BY 1
    ORDER BY trip_count DESC
    `,
    params,
  );
}

export async function seasonality(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT dayname(t.pickup_datetime) AS weekday,
           extract('dow' FROM t.pickup_datetime) AS weekday_num,
           extract('hour' FROM t.pickup_datetime) AS pickup_hour,
           count(*) AS trip_count
    ${fromSql}
    GROUP BY 1, 2, 3
    ORDER BY 2, 3
    `,
    params,
  );
}

export async function odMatrix(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT p.borough AS pickup_borough,
           d.borough AS dropoff_borough,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue
    ${fromSql}
    GROUP BY 1, 2
    ORDER BY trip_count DESC
    `,
    params,
  );
}

export async function airportTrips(filters: Filters) {
  return overview({ ...filters, airportOnly: true });
}

export async function peakHours(filters: Filters) {
  const rows = (await hourlyDemand(filters, 100000)) as { pickup_hour: string; trip_count: number }[];
  if (!rows.length) return {};
  const byHour = new Map<number, number[]>();
  rows.forEach((row) => {
    const hour = new Date(row.pickup_hour).getHours();
    byHour.set(hour, [...(byHour.get(hour) ?? []), Number(row.trip_count)]);
  });
  const hourly = Array.from(byHour.entries()).map(([hour, values]) => ({
    hour,
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
  }));
  const busiest = hourly.reduce((best, row) => (row.avg > best.avg ? row : best), hourly[0]);
  const slowest = hourly.reduce((best, row) => (row.avg < best.avg ? row : best), hourly[0]);
  const values = rows.map((row) => Number(row.trip_count));
  let anomalies = 0;
  values.forEach((value, index) => {
    const window = values.slice(Math.max(0, index - 24), index);
    if (window.length < 6) return;
    const mean = window.reduce((sum, item) => sum + item, 0) / window.length;
    const variance = window.reduce((sum, item) => sum + (item - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    if (Math.abs(value - mean) > 2 * std) anomalies += 1;
  });
  return {
    busiest_hour: busiest.hour,
    busiest_hour_avg_trips: Number(busiest.avg.toFixed(2)),
    slowest_hour: slowest.hour,
    slowest_hour_avg_trips: Number(slowest.avg.toFixed(2)),
    peak_offpeak_ratio: slowest.avg ? Number((busiest.avg / slowest.avg).toFixed(2)) : null,
    anomaly_count: anomalies,
  };
}

export async function demandAnomalies(filters: Filters) {
  const rows = (await hourlyDemand(filters, 100000)) as { pickup_hour: string; trip_count: number }[];
  return rows.map((row, index) => {
    const window = rows.slice(Math.max(0, index - 24), index).map((item) => Number(item.trip_count));
    const mean = window.length ? window.reduce((sum, item) => sum + item, 0) / window.length : null;
    const variance = mean === null ? 0 : window.reduce((sum, item) => sum + (item - mean) ** 2, 0) / Math.max(window.length, 1);
    const std = Math.sqrt(variance);
    const upper = mean === null ? null : mean + 2 * std;
    const lower = mean === null ? null : Math.max(0, mean - 2 * std);
    const value = Number(row.trip_count);
    return {
      ...row,
      rolling_mean: mean,
      upper_band: upper,
      lower_band: lower,
      is_anomaly: upper !== null && lower !== null && (value > upper || value < lower),
    };
  });
}

export async function forecast(filters: Filters, horizon = 24, window = 24) {
  const history = (await hourlyDemand(filters, 100000)) as { pickup_hour: string; trip_count: number }[];
  if (!history.length) return [];
  const backtest = history.map((row, index) => {
    const previous = history[index - 1]?.trip_count ?? null;
    const previousWindow = history.slice(Math.max(0, index - window), index).map((item) => Number(item.trip_count));
    const moving = previousWindow.length ? previousWindow.reduce((sum, item) => sum + item, 0) / previousWindow.length : null;
    const seasonal = history[index - 24]?.trip_count ?? null;
    return {
      pickup_hour: row.pickup_hour,
      actual: Number(row.trip_count),
      naive_forecast: previous,
      moving_average_forecast: moving,
      seasonal_naive_forecast: seasonal,
    };
  });
  const lastDate = new Date(history[history.length - 1].pickup_hour);
  const lastValue = Number(history[history.length - 1].trip_count);
  const windowValues = history.slice(-window).map((row) => Number(row.trip_count));
  const movingValue = windowValues.reduce((sum, item) => sum + item, 0) / windowValues.length;
  const seasonalValues = history.slice(-24).map((row) => Number(row.trip_count));
  const future = Array.from({ length: horizon }, (_, index) => {
    const next = new Date(lastDate);
    next.setHours(lastDate.getHours() + index + 1);
    return {
      pickup_hour: next.toISOString(),
      actual: null,
      naive_forecast: lastValue,
      moving_average_forecast: movingValue,
      seasonal_naive_forecast: seasonalValues[index % Math.max(seasonalValues.length, 1)] ?? lastValue,
    };
  });
  return [...backtest, ...future];
}

function regressionMetrics(rows: Row[], column: string) {
  const pairs = rows
    .filter((row) => row.actual !== null && row[column] !== null && row[column] !== undefined)
    .map((row) => ({ actual: Number(row.actual), predicted: Number(row[column]) }));
  if (!pairs.length) return { mae: null, rmse: null, mape: null };
  const errors = pairs.map((pair) => pair.actual - pair.predicted);
  const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length);
  const nonZero = pairs.filter((pair) => pair.actual !== 0);
  const mape = nonZero.length ? nonZero.reduce((sum, pair) => sum + Math.abs((pair.actual - pair.predicted) / pair.actual), 0) / nonZero.length * 100 : null;
  return { mae, rmse, mape };
}

export async function forecastMetrics(filters: Filters, window = 24) {
  const rows = await forecast(filters, 0, window);
  return [
    { model: "Naive", ...regressionMetrics(rows, "naive_forecast") },
    { model: "Moving average", ...regressionMetrics(rows, "moving_average_forecast") },
    { model: "Seasonal naive", ...regressionMetrics(rows, "seasonal_naive_forecast") },
  ];
}

export async function zoneNames() {
  const rows = await queryRows<{ zone: string }>("SELECT zone FROM zones WHERE zone IS NOT NULL ORDER BY zone");
  return rows.map((row) => row.zone);
}

export async function zoneList() {
  return queryRows<{ location_id: number; borough: string; zone: string; service_zone: string }>(`
    SELECT location_id, borough, zone, service_zone
    FROM zones
    WHERE zone IS NOT NULL
    ORDER BY borough, zone
  `);
}

export async function zoneDetail(zoneId: number, filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  const scopedFrom = `${fromSql} AND (t.pickup_location_id = $zoneId OR t.dropoff_location_id = $zoneId)`;
  const detail = await queryOne(
    `
    SELECT z.location_id, z.borough, z.zone, z.service_zone
    FROM zones z
    WHERE z.location_id = $zoneId
    `,
    { zoneId },
  );
  const metrics = await queryOne(
    `
    SELECT count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(t.trip_distance), 2) AS avg_distance,
           round(avg(date_diff('minute', t.pickup_datetime, t.dropoff_datetime)), 2) AS avg_duration_min,
           round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct,
           round(avg(CASE WHEN p.service_zone = 'Airport' OR d.service_zone = 'Airport' THEN 1 ELSE 0 END) * 100, 2) AS airport_connection_share_pct
    ${scopedFrom}
    `,
    { ...params, zoneId },
  );
  return { ...detail, ...metrics };
}

export async function zoneInboundOutbound(zoneId: number, filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT direction,
           count(*) AS trip_count,
           round(sum(total_amount), 2) AS total_revenue,
           round(avg(total_amount), 2) AS avg_total_amount,
           round(avg(trip_distance), 2) AS avg_distance
    FROM (
      SELECT CASE
               WHEN t.pickup_location_id = $zoneId AND t.dropoff_location_id = $zoneId THEN 'internal'
               WHEN t.pickup_location_id = $zoneId THEN 'outbound'
               WHEN t.dropoff_location_id = $zoneId THEN 'inbound'
             END AS direction,
             t.total_amount,
             t.trip_distance
      ${fromSql} AND (t.pickup_location_id = $zoneId OR t.dropoff_location_id = $zoneId)
    )
    GROUP BY 1
    ORDER BY trip_count DESC
    `,
    { ...params, zoneId },
  );
}

export async function zoneTopOrigins(zoneId: number, filters: Filters, limit = 15) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT p.location_id, p.borough, p.zone,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount
    ${fromSql}
    AND t.dropoff_location_id = $zoneId
    GROUP BY 1, 2, 3
    ORDER BY trip_count DESC
    LIMIT $limit
    `,
    { ...params, zoneId, limit },
  );
}

export async function zoneTopDestinations(zoneId: number, filters: Filters, limit = 15) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT d.location_id, d.borough, d.zone,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount
    ${fromSql}
    AND t.pickup_location_id = $zoneId
    GROUP BY 1, 2, 3
    ORDER BY trip_count DESC
    LIMIT $limit
    `,
    { ...params, zoneId, limit },
  );
}

export async function zoneHourlyDemand(zoneId: number, filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT date_trunc('hour', t.pickup_datetime) AS pickup_hour,
           count(*) AS trip_count
    ${fromSql}
    AND (t.pickup_location_id = $zoneId OR t.dropoff_location_id = $zoneId)
    GROUP BY 1
    ORDER BY 1
    `,
    { ...params, zoneId },
  );
}

export async function routeDetail(pickupZone: string, dropoffZone: string, filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  const route = await queryOne(
    `
    SELECT count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(t.trip_distance), 2) AS avg_distance,
           round(avg(date_diff('minute', t.pickup_datetime, t.dropoff_datetime)), 2) AS avg_duration_min,
           round(avg(CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END) * 100, 2) AS avg_tip_rate_pct
    ${fromSql}
    AND p.zone = $pickupZone
    AND d.zone = $dropoffZone
    `,
    { ...params, pickupZone, dropoffZone },
  );
  const system = await overview(filters);
  return { pickup_zone: pickupZone, dropoff_zone: dropoffZone, route, system };
}

export async function routeHourlyDemand(pickupZone: string, dropoffZone: string, filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT date_trunc('hour', t.pickup_datetime) AS pickup_hour,
           count(*) AS trip_count
    ${fromSql}
    AND p.zone = $pickupZone
    AND d.zone = $dropoffZone
    GROUP BY 1
    ORDER BY 1
    `,
    { ...params, pickupZone, dropoffZone },
  );
}

export async function routeFareDistribution(pickupZone: string, dropoffZone: string, filters: Filters, limit = 1000) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT t.fare_amount, t.tip_amount, t.total_amount, t.trip_distance,
           CASE WHEN t.total_amount > 0 THEN t.tip_amount / t.total_amount ELSE 0 END AS tip_rate,
           date_diff('minute', t.pickup_datetime, t.dropoff_datetime) AS duration_min
    ${fromSql}
    AND p.zone = $pickupZone
    AND d.zone = $dropoffZone
    ORDER BY t.total_amount DESC
    LIMIT $limit
    `,
    { ...params, pickupZone, dropoffZone, limit },
  );
}

export async function airportAnalytics(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT airport_zone,
           count(*) AS trip_count,
           round(sum(total_amount), 2) AS total_revenue,
           round(avg(total_amount), 2) AS avg_total_amount,
           round(avg(trip_distance), 2) AS avg_distance,
           round(avg(duration_min), 2) AS avg_duration_min,
           round(avg(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) * 100, 2) AS outbound_share_pct,
           round(avg(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) * 100, 2) AS inbound_share_pct
    FROM (
      SELECT CASE
               WHEN p.service_zone = 'Airport' THEN p.zone
               WHEN d.service_zone = 'Airport' THEN d.zone
             END AS airport_zone,
             CASE
               WHEN p.service_zone = 'Airport' AND d.service_zone = 'Airport' THEN 'airport-to-airport'
               WHEN p.service_zone = 'Airport' THEN 'outbound'
               WHEN d.service_zone = 'Airport' THEN 'inbound'
             END AS direction,
             t.total_amount,
             t.trip_distance,
             date_diff('minute', t.pickup_datetime, t.dropoff_datetime) AS duration_min
      ${fromSql}
      AND (p.service_zone = 'Airport' OR d.service_zone = 'Airport')
    )
    GROUP BY 1
    ORDER BY trip_count DESC
    `,
    params,
  );
}

export async function airportRoutes(filters: Filters, limit = 25) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT p.zone AS pickup_zone,
           d.zone AS dropoff_zone,
           CASE
             WHEN p.service_zone = 'Airport' THEN p.zone
             WHEN d.service_zone = 'Airport' THEN d.zone
           END AS airport_zone,
           CASE
             WHEN p.service_zone = 'Airport' AND d.service_zone = 'Airport' THEN 'airport-to-airport'
             WHEN p.service_zone = 'Airport' THEN 'outbound'
             WHEN d.service_zone = 'Airport' THEN 'inbound'
           END AS direction,
           count(*) AS trip_count,
           round(sum(t.total_amount), 2) AS total_revenue,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(t.trip_distance), 2) AS avg_distance
    ${fromSql}
    AND (p.service_zone = 'Airport' OR d.service_zone = 'Airport')
    GROUP BY 1, 2, 3, 4
    ORDER BY trip_count DESC
    LIMIT $limit
    `,
    { ...params, limit },
  );
}

export async function airportHourlyDemand(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT date_trunc('hour', t.pickup_datetime) AS pickup_hour,
           CASE
             WHEN p.service_zone = 'Airport' THEN p.zone
             WHEN d.service_zone = 'Airport' THEN d.zone
           END AS airport_zone,
           count(*) AS trip_count
    ${fromSql}
    AND (p.service_zone = 'Airport' OR d.service_zone = 'Airport')
    GROUP BY 1, 2
    ORDER BY 1, 2
    `,
    params,
  );
}

export async function airportFareComparison(filters: Filters) {
  const { fromSql, params } = filteredFrom(filters);
  return queryRows(
    `
    SELECT CASE WHEN p.service_zone = 'Airport' OR d.service_zone = 'Airport' THEN 'airport' ELSE 'non-airport' END AS segment,
           count(*) AS trip_count,
           round(avg(t.total_amount), 2) AS avg_total_amount,
           round(avg(t.trip_distance), 2) AS avg_distance,
           round(avg(date_diff('minute', t.pickup_datetime, t.dropoff_datetime)), 2) AS avg_duration_min
    ${fromSql}
    GROUP BY 1
    ORDER BY segment
    `,
    params,
  );
}

export async function tripSearch(
  filters: Filters,
  options: {
    limit?: number;
    pickupZone?: string | null;
    dropoffZone?: string | null;
    minFare?: number | null;
    maxFare?: number | null;
    sortBy?: string;
    sortDir?: string;
    relatedZoneId?: number | null;
  } = {},
) {
  let { fromSql, params } = filteredFrom(filters);
  const extra: string[] = [];
  if (options.pickupZone && options.pickupZone !== "All") {
    extra.push("p.zone = $pickupZone");
    params = { ...params, pickupZone: options.pickupZone };
  }
  if (options.dropoffZone && options.dropoffZone !== "All") {
    extra.push("d.zone = $dropoffZone");
    params = { ...params, dropoffZone: options.dropoffZone };
  }
  if (options.minFare !== null && options.minFare !== undefined) {
    extra.push("t.total_amount >= $minFare");
    params = { ...params, minFare: options.minFare };
  }
  if (options.maxFare !== null && options.maxFare !== undefined) {
    extra.push("t.total_amount <= $maxFare");
    params = { ...params, maxFare: options.maxFare };
  }
  if (options.relatedZoneId !== null && options.relatedZoneId !== undefined) {
    extra.push("(t.pickup_location_id = $relatedZoneId OR t.dropoff_location_id = $relatedZoneId)");
    params = { ...params, relatedZoneId: options.relatedZoneId };
  }
  if (extra.length) {
    fromSql += `${fromSql.includes("WHERE") ? " AND " : " WHERE "}${extra.join(" AND ")}`;
  }
  const sortColumns: Record<string, string> = {
    pickup_datetime: "t.pickup_datetime",
    total_amount: "t.total_amount",
    trip_distance: "t.trip_distance",
    tip_amount: "t.tip_amount",
  };
  const sortSql = sortColumns[options.sortBy ?? "pickup_datetime"] ?? "t.pickup_datetime";
  const direction = options.sortDir === "asc" ? "ASC" : "DESC";
  return queryRows(
    `
    SELECT t.trip_id, t.pickup_datetime, t.dropoff_datetime,
           p.zone AS pickup_zone, d.zone AS dropoff_zone,
           p.borough AS pickup_borough, d.borough AS dropoff_borough,
           t.passenger_count, t.trip_distance, t.fare_amount, t.tip_amount,
           t.total_amount, CAST(t.payment_type AS VARCHAR) AS payment_type,
           date_diff('minute', t.pickup_datetime, t.dropoff_datetime) AS duration_min
    ${fromSql}
    ORDER BY ${sortSql} ${direction}
    LIMIT $limit
    `,
    { ...params, limit: options.limit ?? 50 },
  );
}

export async function zoneGeojson(filters: Filters, kind = "pickup", valueColumn = "trip_count") {
  if (!existsSync(ZONES_GEOJSON_PATH)) return null;
  const metrics = await topZones(filters, kind, 500) as Row[];
  const lookup = new Map(metrics.map((row) => [Number(row.location_id), row]));
  const maxValue = Math.max(0, ...metrics.map((row) => Number(row[valueColumn] ?? 0)));
  const geojson = JSON.parse(await readFile(ZONES_GEOJSON_PATH, "utf8"));
  geojson.features = geojson.features.map((feature: Row) => {
    const props = feature.properties as Row;
    const locationId = Number(props.locationid);
    const metric = lookup.get(locationId);
    const value = Number(metric?.[valueColumn] ?? 0);
    const intensity = maxValue ? value / maxValue : 0;
    return {
      ...feature,
      properties: {
        ...props,
        trip_count: Number(metric?.trip_count ?? 0),
        total_revenue: Number(metric?.total_revenue ?? 0),
        fill_color: [255, Math.round(235 - 150 * intensity), Math.round(170 - 120 * intensity), Math.round(90 + 150 * intensity)],
      },
    };
  });
  return geojson;
}
