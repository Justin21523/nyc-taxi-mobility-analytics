import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, summaryJson } from "@/lib/server/exporters";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  return downloadResponse(await summaryJson(parseFilters(request.nextUrl.searchParams)), "application/json", "summary.json");
}

