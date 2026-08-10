import { NextResponse } from "next/server";
import { TOOLS, toolAvailable } from "@/lib/engine/tools";
import { getEngineStatusList } from "@/lib/engine/engines";
import { FORMATS } from "@/lib/engine/formats";
import { MAX_FILE_SIZE, MAX_FILES_PER_JOB, MAX_TOTAL_SIZE } from "@/lib/engine/safety";

export const dynamic = "force-dynamic";

export async function GET() {
  const formats = Object.values(FORMATS).map((f) => ({
    ext: f.ext,
    name: f.name,
    category: f.category,
  }));

  const tools = TOOLS.map((t) => ({
    id: t.id,
    slug: t.slug,
    category: t.category,
    from: t.from,
    to: t.to,
    fixedFrom: t.fixed?.from,
    fixedTo: t.fixed?.to,
    multi: t.multi,
    available: toolAvailable(t),
    op: t.op,
  }));

  return NextResponse.json({
    name: "FConvert",
    version: "1.0.0",
    engines: getEngineStatusList(),
    formats,
    tools,
    limits: {
      maxFileSize: MAX_FILE_SIZE,
      maxFilesPerJob: MAX_FILES_PER_JOB,
      maxTotalSize: MAX_TOTAL_SIZE,
    },
  });
}
