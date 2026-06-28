import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { scenarioImpact } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => scenarioImpact(
    request.nextUrl.searchParams.get("type") ?? "airport_demand",
    Number(request.nextUrl.searchParams.get("percent") ?? 10),
    parseFilters(request.nextUrl.searchParams),
  ), request);
}

