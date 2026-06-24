import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { airportTrips } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => airportTrips(parseFilters(request.nextUrl.searchParams)), request);
}

