import { NextRequest } from "next/server";

import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { zoneDetail, zoneHourlyDemand, zoneTopDestinations, zoneTopOrigins } from "@/lib/server/queries";

export function generateStaticParams() {
  return [{ zoneId: "1" }];
}

export const dynamic = "force-static";

export function GET(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  return route(async () => {
    const { zoneId } = await params;
    const id = Number(zoneId);
    const filters = parseFilters(request.nextUrl.searchParams);
    const [detail, topOrigins, topDestinations, hourlyDemand] = await Promise.all([
      zoneDetail(id, filters),
      zoneTopOrigins(id, filters),
      zoneTopDestinations(id, filters),
      zoneHourlyDemand(id, filters),
    ]);
    return { detail, topOrigins, topDestinations, hourlyDemand };
  }, request);
}

