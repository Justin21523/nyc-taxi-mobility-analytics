import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { zoneGeojson } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => zoneGeojson(
    parseFilters(request.nextUrl.searchParams),
    request.nextUrl.searchParams.get("kind") ?? "pickup",
    request.nextUrl.searchParams.get("valueColumn") ?? "trip_count",
  ), request);
}

