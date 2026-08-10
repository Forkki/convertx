import sharp from "sharp";
import type { FormatEnum, FitEnum, ResizeOptions } from "sharp";
import { getFormat } from "./formats";
import { sanitizeOutputName, presetQuality, clampInt, ConversionError } from "./safety";
import type { ConversionSettings, OutputFileData, ProgressCb, UploadedFileData } from "./types";

const PNG_COMPRESSION: Record<string, number> = { none: 0, low: 2, medium: 6, high: 9 };
const BACKGROUND = "white";

export function mimeFor(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    tiff: "image/tiff",
    bmp: "image/bmp",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function convertImage(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const target = settings.target;
  const fmt = getFormat(target);
  if (!fmt || fmt.category !== "image") {
    throw new ConversionError("unsupported", `Cannot encode to .${target}`);
  }

  onProgress?.({ phase: "analyzing", label: "Reading image…", pct: 5 });

  let pipeline = sharp(input.buffer);

  const meta = await pipeline.metadata().catch(() => null);
  if (!meta) throw new ConversionError("corrupt", `${input.name} could not be read as an image.`);

  const quality = presetQuality(settings.quality ?? "high", settings.imageQuality, 88);

  if (settings.width || settings.height) {
    const resizeOpts: ResizeOptions = { withoutEnlargement: true };
    resizeOpts.fit = (settings.fit ?? "inside") as keyof FitEnum;
    if (settings.width) resizeOpts.width = clampInt(settings.width, 0, 64, 12000);
    if (settings.height) resizeOpts.height = clampInt(settings.height, 0, 64, 12000);
    pipeline = pipeline.resize(resizeOpts);
  }

  onProgress?.({ phase: "encoding", label: "Encoding output…", pct: 30 });

  const hasAlpha = !!meta.hasAlpha;
  const flatten = target === "jpg" && hasAlpha;

  if (flatten) {
    const bg =
      settings.background && /^#[0-9a-fA-F]{3,8}$/.test(settings.background) ? settings.background : BACKGROUND;
    pipeline = pipeline.flatten({ background: bg });
  }

  if (settings.colorMode === "grayscale") pipeline = pipeline.grayscale();
  if (settings.colorMode === "bw") pipeline = pipeline.threshold();

  if (settings.dpi) {
    pipeline = pipeline.withMetadata({ density: settings.dpi });
  } else if (settings.keepMetadata) {
    pipeline = pipeline.withMetadata();
  }

  onProgress?.({ phase: "encoding", label: "Encoding output…", pct: 55 });

  let out: Buffer;
  switch (target) {
    case "jpg":
      out = await pipeline.jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
      break;
    case "png": {
      const level = PNG_COMPRESSION[settings.compression ?? "medium"] ?? 6;
      out = await pipeline.png({ compressionLevel: level, adaptiveFiltering: true }).toBuffer();
      break;
    }
    case "webp":
      out = await pipeline.webp({ quality, effort: 4 }).toBuffer();
      break;
    case "avif":
      out = await pipeline.avif({ quality, effort: 4 }).toBuffer();
      break;
    case "gif":
      out = await pipeline.gif().toBuffer();
      break;
    case "tiff":
      out = await pipeline.tiff({ quality }).toBuffer();
      break;
    default:
      out = await pipeline.toFormat(target as keyof FormatEnum).toBuffer();
      break;
  }

  onProgress?.({ phase: "encoding", pct: 100 });

  return {
    name: sanitizeOutputName(input.name, target),
    mime: mimeFor(target),
    buffer: out,
  };
}

export async function imagePreview(buffer: Buffer, maxDim = 520): Promise<string> {
  try {
    const { width, height } = await sharp(buffer).metadata();
    if (!width || !height) return "";
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const resized = await sharp(buffer)
      .resize({ width: Math.round(width * scale), height: Math.round(height * scale) })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    return "";
  }
}
