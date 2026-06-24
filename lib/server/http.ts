import { NextRequest, NextResponse } from "next/server";

export function ok(data: unknown): NextResponse {
  return NextResponse.json(data);
}

export function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function route(handler: (request: NextRequest) => Promise<unknown>, request: NextRequest): Promise<NextResponse> {
  try {
    return ok(await handler(request));
  } catch (error) {
    return handleError(error);
  }
}

