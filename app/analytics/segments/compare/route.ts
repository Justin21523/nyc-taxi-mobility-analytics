import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { compareSegments } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => compareSegments(
    request.nextUrl.searchParams.get("left") ?? "airport",
    request.nextUrl.searchParams.get("right") ?? "non_airport",
    parseFilters(request.nextUrl.searchParams),
  ), request);
}

