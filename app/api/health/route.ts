import { NextRequest } from "next/server";

import { route } from "@/lib/server/http";
import { health } from "@/lib/server/queries";

export const dynamic = "force-static";

export function GET(request: NextRequest) {
  return route(async () => health(), request);
}

