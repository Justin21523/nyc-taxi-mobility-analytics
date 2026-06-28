import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, routesCsv } from "@/lib/server/exporters";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  return downloadResponse(await routesCsv(parseFilters(request.nextUrl.searchParams)), "text/csv", "routes.csv");
}

