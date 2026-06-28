import { NextRequest } from "next/server";
import { parseFilters } from "@/lib/server/filters";
import { downloadResponse, markdownReport } from "@/lib/server/exporters";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  return downloadResponse(await markdownReport(parseFilters(request.nextUrl.searchParams)), "text/markdown", "mobility-report.md");
}

