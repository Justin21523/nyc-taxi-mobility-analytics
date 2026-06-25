import { forecast, overview, routes, topZones, tripSearch } from "./queries";
import type { Filters } from "./filters";

type Row = Record<string, unknown>;

export function csv(rows: Row[]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
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
  const topZone = zoneRows[0];
  const topRoute = routeRows[0];
  const revenueRoute = [...routeRows].sort((a, b) => Number(b.total_revenue ?? 0) - Number(a.total_revenue ?? 0))[0];
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
    "## Analyst Insights",
    "",
    topZone
      ? `- Demand concentration: ${topZone.zone} is the leading pickup zone with ${topZone.trip_count} trips. 需求集中在 ${topZone.zone}，代表供給配置與區域流向值得優先檢查。`
      : "- Demand concentration: no pickup zone rows are available for the current filters.",
    topRoute
      ? `- Mobility corridor: ${topRoute.pickup_zone} -> ${topRoute.dropoff_zone} is the leading route by trips. This route is the best first candidate for route drilldown.`
      : "- Mobility corridor: no route rows are available for the current filters.",
    revenueRoute
      ? `- Value concentration: ${revenueRoute.pickup_zone} -> ${revenueRoute.dropoff_zone} leads route revenue with ${revenueRoute.total_revenue}. 高收入路線可用來判斷營運價值，而不只是需求量。`
      : "- Value concentration: no revenue route rows are available for the current filters.",
    "- Recommended next step: compare this report with Demand, Zone Map, and Forecast pages using the same filters to connect volume, geography, and baseline prediction.",
    "",
    "## Top Pickup Zones",
    "",
    ...zoneRows.map((row) => `- ${row.zone}: ${row.trip_count} trips`),
    "",
    "## Top Routes",
    "",
    ...routeRows.map((row) => `- ${row.pickup_zone} -> ${row.dropoff_zone}: ${row.trip_count} trips`),
    "",
  ].join("\n");
}
