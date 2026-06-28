import { NextRequest, NextResponse } from "next/server";
import { deleteView, listSavedViews, saveView } from "@/lib/server/savedViews";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(await listSavedViews());
}

export async function POST(request: NextRequest) {
  return NextResponse.json(await saveView(await request.json()));
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(await deleteView(request.nextUrl.searchParams.get("id") ?? ""));
}

