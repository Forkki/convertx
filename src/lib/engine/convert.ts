import { getToolBySlug, toolAvailable } from "./tools";
import { ConversionError } from "./safety";
import { convertImage, imagePreview } from "./image";
import {
  pdfToImages,
  imagesToPdf,
  textToPdf,
  pdfToText,
  mergePdfs,
  splitPdf,
  extractPages,
  deletePages,
  reorderPages,
  rotatePdf,
  compressPdf,
} from "./pdf";
import { convertMedia, extractAudio, videoToGif } from "./media";
import { ocrImage, ocrPdf } from "./ocr";
import type { ConversionSettings, OutputFileData, ProgressCb, UploadedFileData } from "./types";

export interface ConvertJob {
  toolId: string;
  target: string;
  settings: ConversionSettings;
  files: UploadedFileData[];
}

function wrapProgress(cb: ProgressCb, fileIndex: number, fileCount: number, file: string): ProgressCb {
  return (e) => cb({ ...e, fileIndex, fileCount, file });
}

export async function runConversion(job: ConvertJob, onProgress: ProgressCb): Promise<OutputFileData[]> {
  const tool = getToolBySlug(job.toolId);
  if (!tool) throw new ConversionError("unsupported", "Unknown tool.");
  if (!toolAvailable(tool)) {
    throw new ConversionError("noEngine", "This conversion needs an engine that is not installed in this environment.");
  }

  const settings: ConversionSettings = { ...job.settings, target: job.target };
  const files = job.files;
  const n = files.length;

  const emit = (fileIndex: number, pct: number, phase: "rendering" | "encoding" | "extracting" = "rendering") =>
    onProgress({ phase, pct, fileIndex, fileCount: n, file: files[fileIndex]?.name });

  onProgress({ phase: "preparing", label: "Preparing engine…", pct: 2, fileIndex: 0, fileCount: n });

  switch (tool.op) {
    case "image": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await convertImage(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        const preview = out.mime.startsWith("image/") ? await imagePreview(out.buffer, 300) : undefined;
        outputs.push({ ...out, preview });
        emit(i, 100);
      }
      return outputs;
    }
    case "pdf-image": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const pages = await pdfToImages(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(...pages);
        emit(i, 100);
      }
      return outputs;
    }
    case "image-pdf": {
      const out = await imagesToPdf(files, settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""));
      return [out];
    }
    case "pdf-text": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await pdfToText(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100);
      }
      return outputs;
    }
    case "text-pdf": {
      const out = await textToPdf(files, settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""));
      return [out];
    }
    case "pdf-merge":
      return [await mergePdfs(files, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""))];
    case "pdf-split":
      return await splitPdf(files[0], wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""));
    case "pdf-extract":
      return [await extractPages(files[0], settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""))];
    case "pdf-delete":
      return [await deletePages(files[0], settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""))];
    case "pdf-reorder":
      return [await reorderPages(files[0], settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""))];
    case "pdf-rotate":
      return [await rotatePdf(files[0], settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""))];
    case "pdf-compress": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await compressPdf(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100);
      }
      return outputs;
    }
    case "media": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await convertMedia(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100);
      }
      return outputs;
    }
    case "media-extract-audio": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await extractAudio(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100);
      }
      return outputs;
    }
    case "media-to-gif": {
      const out = await videoToGif(files[0], settings, wrapProgress(onProgress, 0, 1, files[0]?.name ?? ""));
      return [out];
    }
    case "ocr": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await ocrImage(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100, "extracting");
      }
      return outputs;
    }
    case "ocr-pdf": {
      const outputs: OutputFileData[] = [];
      for (let i = 0; i < n; i++) {
        const out = await ocrPdf(files[i], settings, wrapProgress(onProgress, i, n, files[i].name));
        outputs.push(out);
        emit(i, 100, "extracting");
      }
      return outputs;
    }
    default:
      throw new ConversionError("noEngine", "This tool is not available in this environment.");
  }
}
