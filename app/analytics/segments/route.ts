import { NextRequest } from "next/server";
import { route } from "@/lib/server/http";
import { segmentPresets } from "@/lib/server/queries";

export function GET(request: NextRequest) {
  return route(async () => segmentPresets, request);
}

