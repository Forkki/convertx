import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import { getDocumentProxy, renderPageAsImage, extractText } from "unpdf";
import sharp from "sharp";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { sanitizeOutputName, presetQuality, parsePageRange, ConversionError, clampInt } from "./safety";
import { mimeFor } from "./image";
import type { ConversionSettings, OutputFileData, ProgressCb, UploadedFileData } from "./types";

const execFileAsync = promisify(execFile);
const canvasImport = () => import("@napi-rs/canvas");

let popplerChecked = false;
let popplerAvailable = false;

async function isPopplerAvailable(): Promise<boolean> {
  if (popplerChecked) return popplerAvailable;
  try {
    await execFileAsync("pdftoppm", ["-v"]);
    popplerAvailable = true;
  } catch (e) {
    popplerAvailable = (e as NodeJS.ErrnoException)?.code !== "ENOENT";
  }
  popplerChecked = true;
  return popplerAvailable;
}

export async function renderPdfPageAsImage(
  buffer: Buffer,
  pageNum: number,
  dpi: number
): Promise<ArrayBuffer | null> {
  if (await isPopplerAvailable()) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "convertx-pdf-"));
    const input = path.join(dir, "input.pdf");
    try {
      fs.writeFileSync(input, buffer);
      await execFileAsync("pdftoppm", [
        "-f", String(pageNum),
        "-l", String(pageNum),
        "-r", String(dpi),
        "-jpeg",
        "-jpegopt", "quality=92",
        "-singlefile",
        input,
        path.join(dir, "page"),
      ]);
      const file = path.join(dir, "page.jpg");
      if (fs.existsSync(file)) return fs.readFileSync(file).buffer as ArrayBuffer;
      return null;
    } catch {
      return null;
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  try {
    const proxy = await getDocumentProxy(new Uint8Array(buffer));
    return await renderPageAsImage(proxy, pageNum, { scale: dpi / 72, canvasImport });
  } catch {
    return null;
  }
}

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  Letter: [612, 792],
  Legal: [612, 1008],
};

function pt(v: number): number {
  return v * 72 / 25.4;
}

async function loadProxy(buffer: Buffer) {
  return getDocumentProxy(new Uint8Array(buffer));
}

export async function pdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const proxy = await loadProxy(buffer);
    return proxy.numPages;
  } catch {
    return 0;
  }
}

export async function pdfToImages(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData[]> {
  const target = settings.target;
  const proxy = await loadProxy(input.buffer);
  const total = proxy.numPages;
  if (!total) throw new ConversionError("corrupt", "PDF has no readable pages.");
  if (total > 300) throw new ConversionError("memory", "This PDF has too many pages to render here.");

  const dpi = clampInt(settings.dpi, 120, 50, 600);
  const pages = parsePageRange(settings.pageRange, total);
  const quality = presetQuality(settings.quality ?? "high", settings.imageQuality, 90);

  const outputs: OutputFileData[] = [];
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pages[i];
    onProgress?.({
      phase: "rendering",
      label: `Processing page ${pageNum} of ${total}`,
      pct: Math.round((i / pages.length) * 95),
      current: i + 1,
      total: pages.length,
    });

    let png: ArrayBuffer | null;
    try {
      png = await renderPdfPageAsImage(input.buffer, pageNum, dpi);
    } catch (e) {
      if (String(e).includes("password") || String(e).toLowerCase().includes("encrypt")) {
        throw new ConversionError("corrupt", "This PDF is password-protected and cannot be rendered.");
      }
      throw new ConversionError("convertFailed", `Could not render page ${pageNum}.`);
    }
    if (!png) throw new ConversionError("convertFailed", `Could not render page ${pageNum}.`);

    let pipeline = sharp(Buffer.from(png));
    if (settings.colorMode === "grayscale") pipeline = pipeline.grayscale();
    if (settings.colorMode === "bw") pipeline = pipeline.threshold();
    if (settings.dpi) pipeline = pipeline.withMetadata({ density: dpi });

    let buffer: Buffer;
    switch (target) {
      case "jpg":
        buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        break;
      case "webp":
        buffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
        break;
      case "tiff":
        buffer = await pipeline.tiff({ quality }).toBuffer();
        break;
      default:
        buffer = await pipeline.png({ compressionLevel: settings.compression === "none" ? 0 : 6 }).toBuffer();
        break;
    }

    const preview = await imagePreviewSmall(buffer);
    const num = pages.length > 1 ? `-${String(pageNum).padStart(2, "0")}` : "";
    outputs.push({
      name: sanitizeOutputName(`${input.name.replace(/\.pdf$/i, "")}${num}`, target),
      mime: mimeFor(target),
      buffer,
      preview,
    });
  }

  onProgress?.({ phase: "encoding", pct: 100 });
  return outputs;
}

async function imagePreviewSmall(buffer: Buffer): Promise<string> {
  try {
    const resized = await sharp(buffer).resize({ width: 320 }).jpeg({ quality: 75 }).toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    return "";
  }
}

async function embedImage(doc: PDFDocument, buffer: Buffer): Promise<unknown> {
  const fmt = await sharp(buffer).metadata();
  if (fmt.format === "jpeg") return doc.embedJpg(buffer);
  return doc.embedPng(buffer);
}

export async function imagesToPdf(
  files: UploadedFileData[],
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await PDFDocument.create();
  const pageSize = settings.pageSize ?? "Original";
  const orientation = settings.orientation ?? "auto";
  const margin = pt(clampInt(settings.margin, 0, 0, 100));

  for (let i = 0; i < files.length; i++) {
    onProgress?.({
      phase: "rendering",
      label: `Adding image ${i + 1} of ${files.length}`,
      pct: Math.round((i / files.length) * 95),
      current: i + 1,
      total: files.length,
    });
    const file = files[i];
    const meta = await sharp(file.buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new ConversionError("corrupt", `${file.name} could not be read as an image.`);
    }

    let [w, h] = PAGE_SIZES[pageSize] ?? [meta.width * 0.75, meta.height * 0.75];
    if (pageSize === "Custom") {
      w = pt(clampInt(settings.pageWidth, 210, 10, 5000));
      h = pt(clampInt(settings.pageHeight, 297, 10, 5000));
    }
    const isLandscapeImage = meta.width > meta.height;
    if ((orientation === "landscape") || (orientation === "auto" && isLandscapeImage)) {
      if (w < h) [w, h] = [h, w];
    } else if (orientation === "portrait") {
      if (w > h) [w, h] = [h, w];
    }

    const page = doc.addPage([w, h]);
    const img = (await embedImage(doc, file.buffer)) as Awaited<ReturnType<typeof doc.embedPng>>;
    const boxW = w - margin * 2;
    const boxH = h - margin * 2;
    const scale = Math.min(boxW / img.width, boxH / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    page.drawImage(img, {
      x: (w - dw) / 2,
      y: (h - dh) / 2,
      width: dw,
      height: dh,
    });
  }

  onProgress?.({ phase: "encoding", pct: 100 });
  const buffer = await doc.save();
  const name = files.length === 1 ? sanitizeOutputName(files[0].name, "pdf") : sanitizeOutputName("images", "pdf");
  return { name, mime: "application/pdf", buffer: Buffer.from(buffer) };
}

const FONT_SIZE = 11;
const LINE_HEIGHT = 15;
const TEXT_MARGIN = 50;

function wrapText(text: string, max = 92): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw || " ";
    if (line.length <= max) {
      lines.push(line);
      continue;
    }
    let cur = "";
    for (const word of line.split(" ")) {
      if ((cur + " " + word).trim().length > max) {
        lines.push(cur.trim());
        cur = word;
      } else {
        cur = (cur + " " + word).trim();
      }
    }
    if (cur.trim()) lines.push(cur.trim());
  }
  return lines;
}

export async function textToPdf(
  files: UploadedFileData[],
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [w, h] = PAGE_SIZES.A4;
  let page = doc.addPage([w, h]);
  let y = h - TEXT_MARGIN;

  const draw = (text: string, isHeading = false) => {
    if (y < TEXT_MARGIN + LINE_HEIGHT) {
      page = doc.addPage([w, h]);
      y = h - TEXT_MARGIN;
    }
    page.drawText(text, {
      x: TEXT_MARGIN,
      y,
      size: isHeading ? 15 : FONT_SIZE,
      font: isHeading ? bold : font,
      color: rgb(0.1, 0.1, 0.15),
    });
    y -= isHeading ? 22 : LINE_HEIGHT;
  };

  for (let fi = 0; fi < files.length; fi++) {
    onProgress?.({ phase: "rendering", label: `Writing ${files[fi].name}…`, pct: Math.round((fi / files.length) * 90) });
    const text = files[fi].buffer.toString("utf8");
    draw(files[fi].name.replace(/\.(txt|csv|md)$/i, ""), true);
    for (const line of wrapText(text)) draw(line);
    if (fi < files.length - 1) draw("");
  }

  onProgress?.({ phase: "encoding", pct: 100 });
  const buffer = await doc.save();
  const name = files.length === 1 ? sanitizeOutputName(files[0].name, "pdf") : sanitizeOutputName("documents", "pdf");
  return { name, mime: "application/pdf", buffer: Buffer.from(buffer) };
}

export async function pdfToText(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  onProgress?.({ phase: "extracting", label: "Extracting text…", pct: 20 });
  const proxy = await loadProxy(input.buffer);
  const { text } = await extractText(proxy, { mergePages: true });
  onProgress?.({ phase: "extracting", pct: 100 });
  const name = sanitizeOutputName(settings.target === "txt" ? input.name : input.name, "txt");
  return {
    name,
    mime: "text/plain",
    buffer: Buffer.from(text ?? "", "utf8"),
  };
}

async function copyPages(source: UploadedFileData) {
  const doc = await PDFDocument.load(source.buffer, { ignoreEncryption: false });
  return doc;
}

export async function mergePdfs(files: UploadedFileData[], onProgress?: ProgressCb): Promise<OutputFileData> {
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress?.({ phase: "rendering", label: `Merging ${files[i].name}…`, pct: Math.round((i / files.length) * 95) });
    const doc = await copyPages(files[i]);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  onProgress?.({ phase: "encoding", pct: 100 });
  const buffer = await out.save();
  return { name: sanitizeOutputName("merged", "pdf"), mime: "application/pdf", buffer: Buffer.from(buffer) };
}

export async function splitPdf(input: UploadedFileData, onProgress?: ProgressCb): Promise<OutputFileData[]> {
  const doc = await copyPages(input);
  const total = doc.getPageCount();
  const outputs: OutputFileData[] = [];
  const stem = input.name.replace(/\.pdf$/i, "");
  for (let i = 0; i < total; i++) {
    onProgress?.({ phase: "rendering", label: `Splitting page ${i + 1} of ${total}`, pct: Math.round((i / total) * 95), current: i + 1, total });
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(doc, [i]);
    out.addPage(page);
    const buf = await out.save();
    outputs.push({
      name: sanitizeOutputName(`${stem}-${String(i + 1).padStart(2, "0")}`, "pdf"),
      mime: "application/pdf",
      buffer: Buffer.from(buf),
    });
  }
  onProgress?.({ phase: "encoding", pct: 100 });
  return outputs;
}

async function buildFromPageIndices(source: UploadedFileData, indices: number[], name: string): Promise<OutputFileData> {
  const doc = await copyPages(source);
  const out = await PDFDocument.create();
  for (const idx of indices) {
    const [page] = await out.copyPages(doc, [idx]);
    out.addPage(page);
  }
  const buffer = await out.save();
  return { name: sanitizeOutputName(name, "pdf"), mime: "application/pdf", buffer: Buffer.from(buffer) };
}

export async function extractPages(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await copyPages(input);
  const total = doc.getPageCount();
  const pages = parsePageRange(settings.pageRange, total);
  onProgress?.({ phase: "rendering", pct: 60 });
  return buildFromPageIndices(input, pages.map((p) => p - 1), input.name.replace(/\.pdf$/i, ""));
}

export async function deletePages(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await copyPages(input);
  const total = doc.getPageCount();
  const del = new Set((settings.pagesToDelete ?? []).map((p) => p - 1));
  const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !del.has(i));
  if (keep.length === 0) throw new ConversionError("unsupported", "Cannot delete every page.");
  onProgress?.({ phase: "rendering", pct: 60 });
  return buildFromPageIndices(input, keep, input.name.replace(/\.pdf$/i, ""));
}

export async function reorderPages(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await copyPages(input);
  const total = doc.getPageCount();
  const order = (settings.pageOrder ?? []).map((p) => p - 1).filter((i) => i >= 0 && i < total);
  const unique = [...new Set(order)];
  if (unique.length === 0) throw new ConversionError("unsupported", "No valid page order provided.");
  onProgress?.({ phase: "rendering", pct: 60 });
  return buildFromPageIndices(input, unique, input.name.replace(/\.pdf$/i, ""));
}

export async function rotatePdf(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const doc = await copyPages(input);
  const deg = clampInt(settings.rotateDeg, 90, -360, 360);
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + deg));
  }
  onProgress?.({ phase: "encoding", pct: 100 });
  const buffer = await doc.save();
  return { name: sanitizeOutputName(input.name.replace(/\.pdf$/i, ""), "pdf"), mime: "application/pdf", buffer: Buffer.from(buffer) };
}

export async function compressPdf(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const proxy = await loadProxy(input.buffer);
  const total = proxy.numPages;
  const dpi = clampInt(settings.dpi, 110, 60, 250);
  const scale = dpi / 72;
  const quality = settings.quality === "max" ? 92 : settings.quality === "high" ? 82 : 70;

  const doc = await PDFDocument.create();
  const pagesToCompress = parsePageRange(settings.pageRange, total);

  for (let i = 0; i < pagesToCompress.length; i++) {
    const pageNum = pagesToCompress[i];
    onProgress?.({
      phase: "rendering",
      label: `Re-rendering page ${pageNum} of ${total}`,
      pct: Math.round((i / pagesToCompress.length) * 92),
      current: i + 1,
      total: pagesToCompress.length,
    });
    const png = await renderPageAsImage(proxy, pageNum, { scale, canvasImport });
    const jpeg = await sharp(Buffer.from(png)).flatten({ background: "white" }).jpeg({ quality }).toBuffer();
    const img = await doc.embedJpg(jpeg);
    const page = doc.addPage([(img.width / scale) * 72 / 72, (img.height / scale) * 72 / 72]);
    page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  }

  onProgress?.({ phase: "encoding", pct: 100 });
  const buffer = await doc.save({ useObjectStreams: true });
  return { name: sanitizeOutputName(`${input.name.replace(/\.pdf$/i, "")}-compressed`, "pdf"), mime: "application/pdf", buffer: Buffer.from(buffer) };
}
