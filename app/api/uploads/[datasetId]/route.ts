import { NextResponse } from "next/server";

import { readUploadReport } from "@/lib/server/uploads";

export function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";

export async function GET(_request: Request, { params }: { params: Promise<{ datasetId: string }> }) {
  const { datasetId } = await params;
  const report = await readUploadReport(datasetId);
  if (!report) return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  return NextResponse.json(report);
}
