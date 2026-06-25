import { DuckDBConnection, DuckDBInstance, type DuckDBValue } from "@duckdb/node-api";
import { existsSync } from "node:fs";

import { SAMPLE_ZONES_PATH, TRIPS_WAREHOUSE_GLOB, UPLOADS_DIR } from "./paths";

let connectionPromise: Promise<DuckDBConnection> | null = null;

export function warehouseReady(): boolean {
  return existsSync(SAMPLE_ZONES_PATH);
}

export async function getConnection(): Promise<DuckDBConnection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const instance = await DuckDBInstance.fromCache(":memory:");
      const connection = await instance.connect();
      await registerViews(connection);
      return connection;
    })();
  }
  return connectionPromise;
}

export async function registerViews(connection: DuckDBConnection): Promise<void> {
  const tripsGlob = TRIPS_WAREHOUSE_GLOB.replaceAll("\\", "/").replaceAll("'", "''");
  const zonesPath = SAMPLE_ZONES_PATH.replaceAll("\\", "/").replaceAll("'", "''");
  await connection.run(`
    CREATE OR REPLACE VIEW trips AS
    SELECT * FROM read_parquet('${tripsGlob}', hive_partitioning=true)
  `);
  await connection.run(`
    CREATE OR REPLACE VIEW zones AS
    SELECT * FROM read_parquet('${zonesPath}')
  `);
}

async function registerUploadedDatasetViews(connection: DuckDBConnection, sql: string): Promise<void> {
  const ids = Array.from(sql.matchAll(/uploaded_trips_([a-z0-9_]+)/g)).map((match) => match[1]);
  for (const rawId of new Set(ids)) {
    const datasetId = rawId.replaceAll("_", "-");
    const parquetPath = `${UPLOADS_DIR}/${datasetId}/processed/trips.parquet`.replaceAll("\\", "/").replaceAll("'", "''");
    if (!existsSync(parquetPath)) continue;
    await connection.run(`
      CREATE OR REPLACE VIEW uploaded_trips_${rawId} AS
      SELECT * FROM read_parquet('${parquetPath}')
    `);
  }
}

export async function queryRows<T = Record<string, unknown>>(sql: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const connection = await getConnection();
  await registerUploadedDatasetViews(connection, sql);
  const reader = await connection.runAndReadAll(sql, params as Record<string, DuckDBValue>);
  return reader.getRowObjectsJson() as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: Record<string, unknown> = {}): Promise<T> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? ({} as T);
}
