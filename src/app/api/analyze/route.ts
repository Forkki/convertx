import { NextResponse } from "next/server";
import { analyzeFile } from "@/lib/engine/analyze";
import { assertFileAllowed, ConversionError, MAX_FILES_PER_JOB } from "@/lib/engine/safety";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFiles = formData.getAll("files") as unknown as File[];
    if (!rawFiles.length) {
      return NextResponse.json({ error: { code: "unsupported", message: "No files provided." } }, { status: 400 });
    }
    if (rawFiles.length > MAX_FILES_PER_JOB) {
      return NextResponse.json(
        { error: { code: "unsupported", message: `Too many files (max ${MAX_FILES_PER_JOB}).` } },
        { status: 400 }
      );
    }

    const results = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const f = rawFiles[i];
      const buffer = Buffer.from(await f.arrayBuffer());
      assertFileAllowed(f.name, buffer.length);
      const id = formData.get(`id-${i}`)?.toString() ?? `f${i}`;
      results.push(await analyzeFile(id, f.name, buffer));
    }

    return NextResponse.json({ files: results });
  } catch (e) {
    if (e instanceof ConversionError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "server", message: "Failed to analyze file." } }, { status: 500 });
  }
}
