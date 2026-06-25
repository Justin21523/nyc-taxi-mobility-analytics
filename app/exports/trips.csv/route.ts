import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, tripsCsv } from "@/lib/server/exporters";

export async function GET(request: NextRequest) {
  return downloadResponse(await tripsCsv(parseFilters(request.nextUrl.searchParams)), "text/csv", "trips.csv");
}

