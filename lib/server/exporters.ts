import { forecast, overview, routes, topZones, tripSearch } from "./queries";
import type { Filters } from "./filters";

type Row = Record<string, unknown>;

export function csv(rows: Row[]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return /[",\\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\\n");
}

export function downloadResponse(body: string, contentType: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function summaryJson(filters: Filters) {
  return JSON.stringify(await overview(filters), null, 2);
}

export async function tripsCsv(filters: Filters) {
  return csv(await tripSearch(filters, { limit: 500 }));
}

export async function zonesCsv(filters: Filters) {
  return csv(await topZones(filters, "pickup", 500));
}

export async function routesCsv(filters: Filters) {
  return csv(await routes(filters, 500));
}

export async function forecastCsv(filters: Filters) {
  return csv(await forecast(filters, 168, 24));
}

export async function markdownReport(filters: Filters) {
  const [summary, zoneRows, routeRows] = await Promise.all([
    overview(filters),
    topZones(filters, "pickup", 5),
    routes(filters, 5),
  ]);
  return [
    "# NYC Taxi Mobility Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Trips: ${summary.trip_count ?? 0}`,
    `- Revenue: ${summary.total_revenue ?? 0}`,
    `- Average fare: ${summary.avg_total_amount ?? 0}`,
    `- Average distance: ${summary.avg_distance ?? 0}`,
    "",
    "## Top Pickup Zones",
    "",
    ...zoneRows.map((row) => `- ${row.zone}: ${row.trip_count} trips`),
    "",
    "## Top Routes",
    "",
    ...routeRows.map((row) => `- ${row.pickup_zone} -> ${row.dropoff_zone}: ${row.trip_count} trips`),
    "",
  ].join("\\n");
}

