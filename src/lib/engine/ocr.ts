import { createWorker, OEM, type Worker } from "tesseract.js";
import { getDocumentProxy, renderPageAsImage } from "unpdf";
import sharp from "sharp";
import { sanitizeOutputName, ConversionError, parsePageRange } from "./safety";
import type { ConversionSettings, OutputFileData, ProgressCb, UploadedFileData } from "./types";

const canvasImport = () => import("@napi-rs/canvas");

let currentProgress: ProgressCb | undefined;

const workerCache = new Map<string, Promise<Worker>>();

function getWorker(lang: string): Promise<Worker> {
  if (!workerCache.has(lang)) {
    workerCache.set(
      lang,
      createWorker(lang, OEM.LSTM_ONLY, {
        logger: ({ progress }) => {
          const cb = currentProgress;
          if (progress !== undefined && cb) {
            cb({ phase: "extracting", label: "Recognizing text…", pct: Math.min(99, Math.round(progress * 100)) });
          }
        },
      }).catch(() => {
        workerCache.delete(lang);
        throw new ConversionError(
          "ocrNetwork",
          `Could not load the OCR language model for "${lang}". A network connection is required on first use.`
        );
      })
    );
  }
  return workerCache.get(lang)!;
}

async function recognizeBuffer(buffer: Buffer, lang: string, onProgress?: ProgressCb): Promise<string> {
  const worker = await getWorker(lang);
  currentProgress = onProgress;
  try {
    const { data } = await worker.recognize(buffer);
    return data.text;
  } finally {
    currentProgress = undefined;
  }
}

export async function ocrImage(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const lang = settings.ocrLang === "tha" ? "tha" : "eng";
  onProgress?.({ phase: "extracting", label: "Starting OCR…", pct: 3 });
  const text = await recognizeBuffer(input.buffer, lang, onProgress);
  onProgress?.({ phase: "extracting", pct: 100 });
  return {
    name: sanitizeOutputName(`${input.name.replace(/\.[^.]+$/, "")}`, "txt"),
    mime: "text/plain",
    buffer: Buffer.from(text, "utf8"),
  };
}

export async function ocrPdf(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const lang = settings.ocrLang === "tha" ? "tha" : "eng";
  const proxy = await getDocumentProxy(new Uint8Array(input.buffer));
  const total = proxy.numPages;
  if (!total) throw new ConversionError("corrupt", "PDF has no readable pages.");
  const pages = parsePageRange(settings.pageRange, total);

  const worker = await getWorker(lang);
  const parts: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pages[i];
    onProgress?.({
      phase: "rendering",
      label: `Rendering page ${pageNum} of ${total}`,
      pct: Math.round((i / pages.length) * 60),
      current: i + 1,
      total: pages.length,
    });
    const png = await renderPageAsImage(proxy, pageNum, { scale: 2, canvasImport });
    const buf = await sharp(Buffer.from(png)).grayscale().png().toBuffer();

    currentProgress = onProgress;
    try {
      const { data } = await worker.recognize(buf);
      parts.push(data.text);
    } finally {
      currentProgress = undefined;
    }
  }
  onProgress?.({ phase: "extracting", pct: 100 });
  const text = parts.join("\n\n");
  return {
    name: sanitizeOutputName(`${input.name.replace(/\.[^.]+$/, "")}-ocr`, "txt"),
    mime: "text/plain",
    buffer: Buffer.from(text, "utf8"),
  };
}
