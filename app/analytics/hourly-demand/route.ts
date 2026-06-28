import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { hourlyDemand } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => hourlyDemand(parseFilters(request.nextUrl.searchParams), Number(request.nextUrl.searchParams.get("limit") ?? 168)), request);
}

