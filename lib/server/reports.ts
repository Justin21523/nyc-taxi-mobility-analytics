import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { DATA_DIR } from "./paths";
import { queryRows } from "./duckdb";

const REPORTS_DIR = path.join(DATA_DIR, "reports");
const WAREHOUSE_TRIPS_DIR = path.join(DATA_DIR, "warehouse", "trips");

export async function readJsonReport<T>(name: string, fallback: T): Promise<T> {
  const filePath = path.join(REPORTS_DIR, name);
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function parquetFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return parquetFiles(fullPath);
    return entry.name.endsWith(".parquet") ? [fullPath] : [];
  }));
  return nested.flat();
}

export async function warehousePartitions() {
  const files = await parquetFiles(WAREHOUSE_TRIPS_DIR);
  const rows = await queryRows<{ year: number; month: number; row_count: number }>(`
    SELECT year, month, count(*) AS row_count
    FROM trips
    GROUP BY 1, 2
    ORDER BY 1, 2
  `);
  const rowLookup = new Map(rows.map((row) => [`${row.year}-${String(row.month).padStart(2, "0")}`, row.row_count]));
  return Promise.all(files.map(async (filePath) => {
    const info = await stat(filePath);
    const year = Number(filePath.match(/year=(\\d+)/)?.[1] ?? 0);
    const month = Number(filePath.match(/month=(\\d+)/)?.[1] ?? 0);
    return {
      year,
      month,
      file_path: path.relative(DATA_DIR, filePath),
      file_size_mb: Number((info.size / 1024 / 1024).toFixed(2)),
      row_count: rowLookup.get(`${year}-${String(month).padStart(2, "0")}`) ?? 0,
    };
  }));
}

export async function warehouseCatalog() {
  const tables = await queryRows(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'main'
    ORDER BY table_name
  `);
  const freshness = await queryRows(`
    SELECT max(pickup_datetime) AS latest_pickup_datetime,
           min(pickup_datetime) AS earliest_pickup_datetime,
           count(*) AS row_count
    FROM trips
  `);
  const schema = await queryRows(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'trips'
    ORDER BY ordinal_position
  `);
  return {
    tables,
    schema,
    freshness: freshness[0] ?? {},
    partitions: await warehousePartitions(),
    dataQuality: await readJsonReport("data_quality_report.json", null),
    benchmark: await readJsonReport("query_latency_benchmark.json", null),
    evaluation: await readJsonReport("evaluation_report.json", null),
  };
}

