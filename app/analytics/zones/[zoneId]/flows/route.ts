import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { zoneInboundOutbound } from "@/lib/server/queries";

export function GET(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  return route(async () => {
    const { zoneId } = await params;
    return zoneInboundOutbound(Number(zoneId), parseFilters(request.nextUrl.searchParams));
  }, request);
}

