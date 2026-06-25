import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, forecastCsv } from "@/lib/server/exporters";

export async function GET(request: NextRequest) {
  return downloadResponse(await forecastCsv(parseFilters(request.nextUrl.searchParams)), "text/csv", "forecast.csv");
}

