import { NextRequest } from "next/server";
import { route } from "@/lib/server/http";
import { warehouseCatalog } from "@/lib/server/reports";

export function GET(request: NextRequest) {
  return route(async () => warehouseCatalog(), request);
}

