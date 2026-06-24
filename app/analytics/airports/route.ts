import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { airportAnalytics, airportFareComparison, airportHourlyDemand, airportRoutes } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => {
    const filters = parseFilters(request.nextUrl.searchParams);
    const [summary, routes, hourlyDemand, fareComparison] = await Promise.all([
      airportAnalytics(filters),
      airportRoutes(filters),
      airportHourlyDemand(filters),
      airportFareComparison(filters),
    ]);
    return { summary, routes, hourlyDemand, fareComparison };
  }, request);
}

