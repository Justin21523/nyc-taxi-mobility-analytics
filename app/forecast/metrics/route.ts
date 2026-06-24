import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { forecastMetrics } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => forecastMetrics(parseFilters(request.nextUrl.searchParams), Number(request.nextUrl.searchParams.get("window") ?? 24)), request);
}

