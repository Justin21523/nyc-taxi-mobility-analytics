import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { topZones } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => topZones(
    parseFilters(request.nextUrl.searchParams),
    request.nextUrl.searchParams.get("kind") ?? "pickup",
    Number(request.nextUrl.searchParams.get("limit") ?? 10),
  ), request);
}

