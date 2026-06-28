import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { tipBehavior } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => tipBehavior(parseFilters(request.nextUrl.searchParams)), request);
}

