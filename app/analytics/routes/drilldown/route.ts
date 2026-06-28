import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { routeDetail, routeFareDistribution, routeHourlyDemand, routes, tripSearch } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => {
    const filters = parseFilters(request.nextUrl.searchParams);
    const fallback = await routes(filters, 1);
    const first = fallback[0] as Record<string, unknown> | undefined;
    const pickupZone = request.nextUrl.searchParams.get("pickupZone") ?? String(first?.pickup_zone ?? "");
    const dropoffZone = request.nextUrl.searchParams.get("dropoffZone") ?? String(first?.dropoff_zone ?? "");
    const [detail, hourlyDemand, fareDistribution, sampleTrips] = await Promise.all([
      routeDetail(pickupZone, dropoffZone, filters),
      routeHourlyDemand(pickupZone, dropoffZone, filters),
      routeFareDistribution(pickupZone, dropoffZone, filters, 500),
      tripSearch(filters, { pickupZone, dropoffZone, limit: 25 }),
    ]);
    return { detail, hourlyDemand, fareDistribution, sampleTrips };
  }, request);
}

