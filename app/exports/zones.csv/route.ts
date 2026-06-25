import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, zonesCsv } from "@/lib/server/exporters";

export async function GET(request: NextRequest) {
  return downloadResponse(await zonesCsv(parseFilters(request.nextUrl.searchParams)), "text/csv", "zones.csv");
}

