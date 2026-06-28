import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { forecast } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => forecast(
    parseFilters(request.nextUrl.searchParams),
    Number(request.nextUrl.searchParams.get("horizon") ?? 24),
    Number(request.nextUrl.searchParams.get("window") ?? 24),
  ), request);
}

