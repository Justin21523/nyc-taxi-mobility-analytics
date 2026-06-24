import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { routes } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => routes(
    parseFilters(request.nextUrl.searchParams),
    Number(request.nextUrl.searchParams.get("limit") ?? 10),
    request.nextUrl.searchParams.get("orderBy") === "total_revenue" ? "total_revenue" : "trip_count",
  ), request);
}

