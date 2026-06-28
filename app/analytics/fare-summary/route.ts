import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { fareSummary } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => fareSummary(parseFilters(request.nextUrl.searchParams)), request);
}

