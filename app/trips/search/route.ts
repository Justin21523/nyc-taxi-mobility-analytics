import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { tripSearch } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return route(async () => tripSearch(parseFilters(searchParams), {
    limit: Number(searchParams.get("limit") ?? 50),
    pickupZone: searchParams.get("pickupZone"),
    dropoffZone: searchParams.get("dropoffZone"),
    minFare: searchParams.get("minFare") ? Number(searchParams.get("minFare")) : null,
    maxFare: searchParams.get("maxFare") ? Number(searchParams.get("maxFare")) : null,
    sortBy: searchParams.get("sortBy") ?? "pickup_datetime",
    sortDir: searchParams.get("sortDir") ?? "desc",
  }), request);
}

