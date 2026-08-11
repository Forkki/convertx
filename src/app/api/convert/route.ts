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

const ZIP_SKIP_BYTES = 60 * 1024 * 1024; // skip the duplicate zip buffer above this
const RESULT_CHUNK = 20; // outputs per result event
const MAX_OUTPUT_BYTES = 80 * 1024 * 1024; // base64 cap per single output event

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

        // Stream results in small chunks so the base64 payload is never materialized
        // as one giant buffer (keeps the free-tier instance under its memory limit).
        const totalBytes = outputs.reduce((s, o) => s + o.buffer.length, 0);
        for (let i = 0; i < outputs.length; i += RESULT_CHUNK) {
          const chunk = outputs.slice(i, i + RESULT_CHUNK);
          const payload = chunk.map((o) => ({
            name: sanitizeFilename(o.name),
            mime: o.mime,
            size: o.buffer.length,
            preview: o.preview,
            data: o.buffer.toString("base64"),
          }));
          const oversized = payload.find((p) => p.data.length > MAX_OUTPUT_BYTES);
          if (oversized) {
            throw new ConversionError(
              "memory",
              `${oversized.name} is too large to send back. Try a lower DPI/quality.`
            );
          }
          send({ type: "result", outputs: payload });
        }

        const zip =
          outputs.length > 1 && totalBytes <= ZIP_SKIP_BYTES
            ? await zipOutputs(outputs, baseZipName || "convertx")
            : undefined;

        if (zip) {
          send({
            type: "result",
            outputs: [],
            zip: {
              name: sanitizeFilename(zip.name),
              mime: zip.mime,
              size: zip.buffer.length,
              data: zip.buffer.toString("base64"),
            },
          });
        }
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
