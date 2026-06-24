import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { fareDistribution } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => fareDistribution(parseFilters(request.nextUrl.searchParams), Number(request.nextUrl.searchParams.get("limit") ?? 1000)), request);
}

