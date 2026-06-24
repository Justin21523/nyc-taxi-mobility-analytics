import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { peakHours } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => peakHours(parseFilters(request.nextUrl.searchParams)), request);
}

