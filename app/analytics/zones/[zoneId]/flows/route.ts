import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { zoneNetwork } from "@/lib/server/queries";

export function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";

export function GET(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  return route(async () => {
    const { zoneId } = await params;
    return zoneNetwork(Number(zoneId), parseFilters(request.nextUrl.searchParams));
  }, request);
}
