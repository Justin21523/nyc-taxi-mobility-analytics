import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getConnection, queryOne, queryRows } from "@/lib/server/duckdb";
import { UPLOADS_DIR } from "@/lib/server/paths";

type ColumnMap = Record<string, string>;

export type UploadReport = {
  datasetId: string;
  fileName: string;
  fileType: "csv" | "parquet";
  sourcePath: string;
  processedPath: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  missingColumns: string[];
  dateRange: { minPickup: string | null; maxPickup: string | null };
  partitions: { year: number; month: number; row_count: number }[];
  summary: Record<string, unknown>;
  status: "ready" | "error";
  error?: string;
};

const required = ["pickup_datetime", "dropoff_datetime", "pickup_location_id", "dropoff_location_id", "fare_amount", "tip_amount", "total_amount", "trip_distance"];

const aliases: Record<string, string[]> = {
  pickup_datetime: ["pickup_datetime", "tpep_pickup_datetime", "lpep_pickup_datetime"],
  dropoff_datetime: ["dropoff_datetime", "dropOff_datetime", "tpep_dropoff_datetime", "lpep_dropoff_datetime"],
  passenger_count: ["passenger_count", "Passenger_count"],
  trip_distance: ["trip_distance"],
  pickup_location_id: ["pickup_location_id", "PULocationID", "pulocationid"],
  dropoff_location_id: ["dropoff_location_id", "DOLocationID", "dolocationid"],
  fare_amount: ["fare_amount"],
  tip_amount: ["tip_amount"],
  total_amount: ["total_amount"],
  payment_type: ["payment_type"],
  vendor_id: ["vendor_id", "VendorID"],
  tolls_amount: ["tolls_amount"],
  congestion_surcharge: ["congestion_surcharge"],
  airport_fee: ["airport_fee", "Airport_fee"],
  cbd_congestion_fee: ["cbd_congestion_fee"],
};

function safeIdentifier(id: string) {
  return id.replace(/[^a-z0-9-]/g, "").slice(0, 48);
}

function quotePath(value: string) {
  return value.replaceAll("\\", "/").replaceAll("'", "''");
}

function quoteIdent(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function readExpression(filePath: string, fileType: "csv" | "parquet") {
  const quoted = quotePath(filePath);
  return fileType === "csv" ? `read_csv_auto('${quoted}', header=true, ignore_errors=true)` : `read_parquet('${quoted}')`;
}

async function sourceColumns(readExpr: string) {
  return queryRows<{ column_name: string }>(`DESCRIBE SELECT * FROM ${readExpr}`);
}

function buildColumnMap(columns: string[]): ColumnMap {
  const lower = new Map(columns.map((column) => [column.toLowerCase(), column]));
  const map: ColumnMap = {};
  for (const [canonical, candidates] of Object.entries(aliases)) {
    const match = candidates.map((candidate) => lower.get(candidate.toLowerCase())).find(Boolean);
    if (match) map[canonical] = match;
  }
  return map;
}

function expr(map: ColumnMap, canonical: string, fallback: string, cast: string) {
  const source = map[canonical];
  return source ? `try_cast(${quoteIdent(source)} AS ${cast})` : fallback;
}

export async function processUpload(file: File): Promise<UploadReport> {
  const originalName = file.name || "uploaded";
  const ext = originalName.toLowerCase().endsWith(".csv") ? "csv" : originalName.toLowerCase().endsWith(".parquet") ? "parquet" : null;
  if (!ext) throw new Error("Only CSV and Parquet files are supported");
  if (file.size > 50 * 1024 * 1024) throw new Error("Upload limit is 50MB");

  const datasetId = safeIdentifier(`${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`);
  const datasetDir = path.join(UPLOADS_DIR, datasetId);
  const processedDir = path.join(datasetDir, "processed");
  await mkdir(processedDir, { recursive: true });
  const sourcePath = path.join(datasetDir, `source.${ext}`);
  const processedPath = path.join(processedDir, "trips.parquet");
  await writeFile(sourcePath, Buffer.from(await file.arrayBuffer()));

  const readExpr = readExpression(sourcePath, ext);
  const columns = (await sourceColumns(readExpr)).map((row) => row.column_name);
  const map = buildColumnMap(columns);
  const missingColumns = required.filter((column) => !map[column]);
  if (missingColumns.length) {
    const report = await writeReport({
      datasetId,
      fileName: originalName,
      fileType: ext,
      sourcePath,
      processedPath,
      rowCount: 0,
      validRows: 0,
      invalidRows: 0,
      missingColumns,
      dateRange: { minPickup: null, maxPickup: null },
      partitions: [],
      summary: {},
      status: "error",
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    });
    return report;
  }

  const normalizedSelect = `
    SELECT
      row_number() OVER ()::BIGINT AS trip_id,
      ${expr(map, "vendor_id", "0", "INTEGER")} AS vendor_id,
      ${expr(map, "pickup_datetime", "NULL", "TIMESTAMP")} AS pickup_datetime,
      ${expr(map, "dropoff_datetime", "NULL", "TIMESTAMP")} AS dropoff_datetime,
      ${expr(map, "passenger_count", "1", "DOUBLE")} AS passenger_count,
      ${expr(map, "trip_distance", "0", "DOUBLE")} AS trip_distance,
      ${expr(map, "pickup_location_id", "NULL", "INTEGER")} AS pickup_location_id,
      ${expr(map, "dropoff_location_id", "NULL", "INTEGER")} AS dropoff_location_id,
      ${expr(map, "fare_amount", "0", "DOUBLE")} AS fare_amount,
      ${expr(map, "tip_amount", "0", "DOUBLE")} AS tip_amount,
      ${expr(map, "tolls_amount", "0", "DOUBLE")} AS tolls_amount,
      ${expr(map, "congestion_surcharge", "0", "DOUBLE")} AS congestion_surcharge,
      ${expr(map, "airport_fee", "0", "DOUBLE")} AS airport_fee,
      ${expr(map, "cbd_congestion_fee", "0", "DOUBLE")} AS cbd_congestion_fee,
      ${expr(map, "total_amount", "0", "DOUBLE")} AS total_amount,
      CAST(${map.payment_type ? quoteIdent(map.payment_type) : "'unknown'"} AS VARCHAR) AS payment_type
    FROM ${readExpr}
  `;
  const validWhere = `
    pickup_datetime IS NOT NULL
    AND dropoff_datetime IS NOT NULL
    AND dropoff_datetime > pickup_datetime
    AND fare_amount >= 0
    AND total_amount >= 0
    AND trip_distance >= 0
    AND pickup_location_id IS NOT NULL
    AND dropoff_location_id IS NOT NULL
  `;
  const connection = await getConnection();
  await connection.run(`COPY (SELECT * FROM (${normalizedSelect}) WHERE ${validWhere}) TO '${quotePath(processedPath)}' (FORMAT PARQUET)`);

  const rowCount = Number((await queryOne<{ count: number }>(`SELECT count(*) AS count FROM (${normalizedSelect})`)).count ?? 0);
  const validRows = Number((await queryOne<{ count: number }>(`SELECT count(*) AS count FROM read_parquet('${quotePath(processedPath)}')`)).count ?? 0);
  const dateRange = await queryOne<{ min_pickup: string | null; max_pickup: string | null }>(`
    SELECT min(pickup_datetime) AS min_pickup, max(pickup_datetime) AS max_pickup
    FROM read_parquet('${quotePath(processedPath)}')
  `);
  const partitions = await queryRows<{ year: number; month: number; row_count: number }>(`
    SELECT year(pickup_datetime) AS year, month(pickup_datetime) AS month, count(*) AS row_count
    FROM read_parquet('${quotePath(processedPath)}')
    GROUP BY 1, 2
    ORDER BY 1, 2
  `);
  const summary = await queryOne(`
    SELECT count(*) AS trip_count,
           round(sum(total_amount), 2) AS total_revenue,
           round(avg(total_amount), 2) AS avg_total_amount,
           round(avg(trip_distance), 2) AS avg_distance
    FROM read_parquet('${quotePath(processedPath)}')
  `);

  return writeReport({
    datasetId,
    fileName: originalName,
    fileType: ext,
    sourcePath,
    processedPath,
    rowCount,
    validRows,
    invalidRows: rowCount - validRows,
    missingColumns,
    dateRange: { minPickup: dateRange.min_pickup, maxPickup: dateRange.max_pickup },
    partitions,
    summary,
    status: "ready",
  });
}

async function writeReport(report: UploadReport) {
  await writeFile(path.join(UPLOADS_DIR, report.datasetId, "report.json"), JSON.stringify(report, null, 2));
  return report;
}

export async function readUploadReport(datasetId: string): Promise<UploadReport | null> {
  const safeId = safeIdentifier(datasetId);
  const reportPath = path.join(UPLOADS_DIR, safeId, "report.json");
  if (!existsSync(reportPath)) return null;
  return JSON.parse(await readFile(reportPath, "utf8")) as UploadReport;
}
