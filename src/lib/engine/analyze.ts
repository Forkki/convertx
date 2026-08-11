import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { detectFormat } from "./detect";
import { pdfPageCount, renderPdfPageAsImage } from "./pdf";
import { imagePreview } from "./image";
import { ConversionError } from "./safety";
import type { Category } from "./formats";

export interface AnalyzeResult {
  id: string;
  name: string;
  ext: string;
  mime: string;
  size: number;
  category: Category;
  width?: number;
  height?: number;
  pages?: number;
  duration?: number;
  preview?: string;
  hasText?: boolean;
}

async function mediaDuration(buffer: Buffer, ext: string): Promise<number | undefined> {
  if (!ffmpegPath) return undefined;
  const ffmpeg: string = ffmpegPath;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "convertx-probe-"));
  const file = path.join(dir, `probe.${ext}`);
  try {
    fs.writeFileSync(file, buffer);
    const { execFile } = await import("child_process");
    const out: string = await new Promise((resolve) => {
      execFile(ffmpeg, ["-i", file], { windowsHide: true }, (_err, _stdout, stderr) => resolve(stderr.toString()));
    });
    const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
    return undefined;
  } catch {
    return undefined;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function analyzeFile(id: string, name: string, buffer: Buffer): Promise<AnalyzeResult> {
  const detected = detectFormat(new Uint8Array(buffer), name);
  const result: AnalyzeResult = {
    id,
    name,
    ext: detected.ext,
    mime: detected.mime,
    size: buffer.length,
    category: detected.category,
  };

  if (detected.category === "image") {
    const meta = await sharp(buffer).metadata().catch(() => null);
    if (meta) {
      result.width = meta.width;
      result.height = meta.height;
    }
    result.preview = await imagePreview(buffer, 460);
    if (!result.preview && detected.ext === "svg") {
      try {
        const png = await sharp(buffer).png().toBuffer();
        result.preview = await imagePreview(png, 460);
      } catch {
        /* ignore */
      }
    }
  } else if (detected.category === "pdf") {
    result.pages = await pdfPageCount(buffer);
    if (result.pages === 0) throw new ConversionError("corrupt", `${name} could not be read as a PDF.`);
    try {
      const png = await renderPdfPageAsImage(buffer, 1, 120);
      if (png) result.preview = await imagePreview(Buffer.from(png), 460);
    } catch {
      /* preview optional */
    }
  } else if (detected.category === "audio" || detected.category === "video") {
    result.duration = await mediaDuration(buffer, detected.ext);
  } else if (detected.category === "text") {
    result.hasText = true;
  }

  return result;
}
