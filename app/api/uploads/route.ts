import { NextResponse } from "next/server";

import { processUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const report = await processUpload(file);
    return NextResponse.json(report, { status: report.status === "ready" ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
