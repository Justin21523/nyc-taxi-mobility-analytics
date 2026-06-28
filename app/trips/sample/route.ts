import { NextRequest } from "next/server";

import { filterSchema } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { tripSearch } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => tripSearch(filterSchema.parse({}), { limit: Number(request.nextUrl.searchParams.get("limit") ?? 20) }), request);
}

