import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { airportAnalytics, airportFareComparison, airportHourlyDemand, airportRoutes } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => {
    const filters = parseFilters(request.nextUrl.searchParams);
    const airportZone = request.nextUrl.searchParams.get("airportZone");
    const [summary, routes, hourlyDemand, fareComparison] = await Promise.all([
      airportAnalytics(filters, airportZone),
      airportRoutes(filters, Number(request.nextUrl.searchParams.get("limit") ?? 25), airportZone),
      airportHourlyDemand(filters, airportZone),
      airportFareComparison(filters),
    ]);
    return { summary, routes, hourlyDemand, fareComparison };
  }, request);
}
