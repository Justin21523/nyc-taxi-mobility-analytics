import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { route } from "@/lib/server/http";
import { anomalyDetail } from "@/lib/server/queries";

export function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";

export function GET(request: NextRequest, { params }: { params: Promise<{ pickupHour: string }> }) {
  return route(async () => {
    const { pickupHour } = await params;
    return anomalyDetail(decodeURIComponent(pickupHour), parseFilters(request.nextUrl.searchParams));
  }, request);
}

