import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { odMatrix } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => odMatrix(parseFilters(request.nextUrl.searchParams)), request);
}

