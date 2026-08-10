import { runConversion, type ConvertJob } from "@/lib/engine/convert";
import { zipOutputs } from "@/lib/engine/zip";
import { sanitizeFilename, baseName } from "@/lib/utils";
import {
  assertFileAllowed,
  ConversionError,
  MAX_FILES_PER_JOB,
  MAX_TOTAL_SIZE,
} from "@/lib/engine/safety";
import type { ConversionSettings, ProgressEvent } from "@/lib/engine/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();

function ndjsonStream(job: ConvertJob, baseZipName: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        const onProgress = (evt: ProgressEvent) => {
          send({ type: "progress", ...evt });
        };

        const outputs = await runConversion(job, onProgress);

        const zip =
          outputs.length > 1
            ? await zipOutputs(outputs, baseZipName || "convertx")
            : undefined;

        send({
          type: "result",
          outputs: outputs.map((o) => ({
            name: sanitizeFilename(o.name),
            mime: o.mime,
            size: o.buffer.length,
            preview: o.preview,
            data: o.buffer.toString("base64"),
          })),
          zip: zip
            ? {
                name: sanitizeFilename(zip.name),
                mime: zip.mime,
                size: zip.buffer.length,
                data: zip.buffer.toString("base64"),
              }
            : undefined,
        });
      } catch (e) {
        console.error("[convert] conversion error:", e);
        const err = e instanceof ConversionError ? e : new ConversionError("server", "Unexpected server error.");
        send({ type: "error", code: err.code, message: err.message });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      /* client disconnected */
    },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFiles = formData.getAll("files") as unknown as File[];

    if (!rawFiles.length) {
      return new Response(
        encoder.encode(JSON.stringify({ type: "error", code: "unsupported", message: "No files provided." }) + "\n"),
        { status: 200, headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } }
      );
    }
    if (rawFiles.length > MAX_FILES_PER_JOB) {
      return new Response(
        encoder.encode(
          JSON.stringify({ type: "error", code: "unsupported", message: `Too many files (max ${MAX_FILES_PER_JOB}).` }) + "\n"
        ),
        { status: 200, headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } }
      );
    }

    const config = JSON.parse((formData.get("config") as string) ?? "{}");
    const settings: ConversionSettings = config.settings ?? {};
    const toolId: string = config.toolId ?? "image-convert";
    const target: string = config.target ?? "";

    let total = 0;
    const buffers: { id: string; name: string; ext: string; mime: string; size: number; buffer: Buffer }[] = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const f = rawFiles[i];
      const buffer = Buffer.from(await f.arrayBuffer());
      assertFileAllowed(f.name, buffer.length);
      total += buffer.length;
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      buffers.push({ id: `f${i}`, name: f.name, ext, mime: f.type, size: buffer.length, buffer });
    }
    if (total > MAX_TOTAL_SIZE) {
      throw new ConversionError("fileTooBig", "The combined size of the files exceeds the job limit.");
    }

    const job: ConvertJob = { toolId, target, settings, files: buffers };
    const baseZipName = baseName(buffers[0]?.name ?? "convertx");

    return new Response(ndjsonStream(job, baseZipName), {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const err = e instanceof ConversionError ? e : new ConversionError("server", "Unexpected server error.");
    return new Response(
      encoder.encode(JSON.stringify({ type: "error", code: err.code, message: err.message }) + "\n"),
      { status: 200, headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } }
    );
  }
}
