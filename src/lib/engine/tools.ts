import {
  IMAGE_INPUT_EXTS,
  IMAGE_OUTPUT_EXTS,
  AUDIO_EXTS,
  VIDEO_EXTS,
  extToCanonical,
  type Engine,
} from "./formats";
import { computeEngineStatus } from "./engines";

export type ToolCategory =
  | "Popular"
  | "PDF"
  | "Images"
  | "Documents"
  | "Audio"
  | "Video"
  | "Compression"
  | "Utilities";

export interface ToolDef {
  id: string;
  slug: string;
  category: ToolCategory;
  from: string[];
  to: string[];
  op: string;
  multi: boolean;
  fixed?: { from: string; to: string }; // display override
  descriptionKey?: string;
}

const OP_ENGINE: Record<string, Engine> = {
  image: "sharp",
  "image-pdf": "pdf-lib",
  "pdf-image": "unpdf",
  "pdf-text": "unpdf",
  "text-pdf": "pdf-lib",
  "pdf-merge": "pdf-lib",
  "pdf-split": "pdf-lib",
  "pdf-extract": "pdf-lib",
  "pdf-delete": "pdf-lib",
  "pdf-reorder": "pdf-lib",
  "pdf-rotate": "pdf-lib",
  "pdf-compress": "unpdf",
  "pdf-encrypt": "none",
  "pdf-decrypt": "none",
  media: "ffmpeg",
  "media-extract-audio": "ffmpeg",
  "media-to-gif": "ffmpeg",
  ocr: "tesseract",
};

export function toolAvailable(tool: ToolDef): boolean {
  const status = computeEngineStatus();
  const engine = OP_ENGINE[tool.op];
  if (!engine) return false;
  if (engine === "sharp" && !status.sharp) return false;
  if (engine === "pdf-lib" && !status["pdf-lib"]) return false;
  if (engine === "unpdf" && !status.unpdf) return false;
  if (engine === "ffmpeg" && !status.ffmpeg) return false;
  if (engine === "tesseract" && !status.tesseract) return false;
  return true;
}

function t(from: string[], to: string[], op: string, id: string, category: ToolCategory, multi = false): ToolDef {
  return {
    id,
    slug: id,
    category,
    from: from.map(extToCanonical),
    to: to.map(extToCanonical),
    op,
    multi,
    fixed: { from: from[0], to: to[0] },
  };
}

const JPG = ["jpg", "jpeg"];
const PNG = ["png"];
const WEBP = ["webp"];
const ALL_IMAGE = [...IMAGE_INPUT_EXTS];
const ANY_IMAGE_TARGET = [...IMAGE_OUTPUT_EXTS];

function pairTools(): ToolDef[] {
  const pairs: [string, string[], string[], ToolCategory][] = [
    ["jpg-to-png", JPG, PNG, "Popular"],
    ["png-to-jpg", PNG, JPG, "Popular"],
    ["jpg-to-webp", JPG, WEBP, "Popular"],
    ["webp-to-jpg", WEBP, JPG, "Popular"],
    ["png-to-webp", PNG, WEBP, "Images"],
    ["webp-to-png", WEBP, PNG, "Images"],
    ["jpg-to-avif", JPG, ["avif"], "Images"],
    ["avif-to-jpg", ["avif"], JPG, "Images"],
    ["tiff-to-jpg", ["tiff", "tif"], JPG, "Images"],
    ["bmp-to-png", ["bmp"], PNG, "Images"],
    ["gif-to-png", ["gif"], PNG, "Images"],
    ["heic-to-jpg", ["heic", "heif"], JPG, "Images"],
    ["png-to-gif", PNG, ["gif"], "Images"],
    ["svg-to-png", ["svg"], PNG, "Images"],
  ];
  return pairs.map(([id, f, to, cat]) => t(f, to, "image", id, cat));
}

function pdfTools(): ToolDef[] {
  return [
    t(["pdf"], ["jpg"], "pdf-image", "pdf-to-jpg", "Popular"),
    t(["pdf"], ["png"], "pdf-image", "pdf-to-png", "PDF"),
    t(["pdf"], ["webp"], "pdf-image", "pdf-to-webp", "PDF"),
    t(["pdf"], ["tiff"], "pdf-image", "pdf-to-tiff", "PDF"),
    t(JPG, ["pdf"], "image-pdf", "jpg-to-pdf", "Popular", true),
    t(PNG, ["pdf"], "image-pdf", "png-to-pdf", "Images", true),
    t(ALL_IMAGE, ["pdf"], "image-pdf", "images-to-pdf", "PDF", true),
    t(["pdf"], ["txt"], "pdf-text", "pdf-to-text", "Utilities"),
    t(["txt", "csv", "md"], ["pdf"], "text-pdf", "txt-to-pdf", "Documents", true),
    t(["pdf"], ["pdf"], "pdf-merge", "pdf-merge", "PDF", true),
    t(["pdf"], ["pdf"], "pdf-split", "pdf-split", "PDF"),
    t(["pdf"], ["pdf"], "pdf-extract", "pdf-extract-pages", "PDF"),
    t(["pdf"], ["pdf"], "pdf-delete", "pdf-delete-pages", "PDF"),
    t(["pdf"], ["pdf"], "pdf-reorder", "pdf-reorder-pages", "PDF"),
    t(["pdf"], ["pdf"], "pdf-rotate", "pdf-rotate", "PDF"),
    t(["pdf"], ["pdf"], "pdf-encrypt", "pdf-encrypt", "PDF"),
    t(["pdf"], ["pdf"], "pdf-decrypt", "pdf-decrypt", "PDF"),
  ];
}

function docTools(): ToolDef[] {
  return [
    t(["docx"], ["pdf"], "none", "docx-to-pdf", "Documents", true),
    t(["pdf"], ["docx"], "none", "pdf-to-docx", "Documents"),
    t(["xlsx"], ["pdf"], "none", "xlsx-to-pdf", "Documents", true),
    t(["pdf"], ["xlsx"], "none", "pdf-to-excel", "Documents"),
    t(["pptx"], ["pdf"], "none", "pptx-to-pdf", "Documents", true),
    t(["pdf"], ["pptx"], "none", "pdf-to-pptx", "Documents"),
    t(["odt"], ["pdf"], "none", "odt-to-pdf", "Documents", true),
    t(["rtf"], ["pdf"], "none", "rtf-to-pdf", "Documents"),
    t(["html"], ["pdf"], "none", "html-to-pdf", "Documents"),
  ];
}

function audioTools(): ToolDef[] {
  return [
    t(["mp3"], ["wav"], "media", "mp3-to-wav", "Audio"),
    t(["wav"], ["mp3"], "media", "wav-to-mp3", "Popular"),
    t(["mp3"], ["flac"], "media", "mp3-to-flac", "Audio"),
    t(["flac"], ["mp3"], "media", "flac-to-mp3", "Audio"),
    t(["ogg"], ["mp3"], "media", "ogg-to-mp3", "Audio"),
    t(["m4a"], ["mp3"], "media", "m4a-to-mp3", "Audio"),
    t(["aac"], ["mp3"], "media", "aac-to-mp3", "Audio"),
    t(["wav"], ["flac"], "media", "wav-to-flac", "Audio"),
    t(["mp3"], ["ogg"], "media", "mp3-to-ogg", "Audio"),
    t(["wav"], ["ogg"], "media", "wav-to-ogg", "Audio"),
    t(["wav"], ["aac"], "media", "wav-to-aac", "Audio"),
    t(VIDEO_EXTS, ["mp3"], "media-extract-audio", "video-to-mp3", "Popular"),
    t(VIDEO_EXTS, ["wav"], "media-extract-audio", "video-to-wav", "Audio"),
  ];
}

function videoTools(): ToolDef[] {
  return [
    t(["mp4"], ["webm"], "media", "mp4-to-webm", "Video"),
    t(["webm"], ["mp4"], "media", "webm-to-mp4", "Video"),
    t(["mp4"], ["mov"], "media", "mp4-to-mov", "Video"),
    t(["mov"], ["mp4"], "media", "mov-to-mp4", "Popular"),
    t(["avi"], ["mp4"], "media", "avi-to-mp4", "Video"),
    t(["mkv"], ["mp4"], "media", "mkv-to-mp4", "Video"),
    t(["mp4"], ["avi"], "media", "mp4-to-avi", "Video"),
    t(["mp4"], ["gif"], "media-to-gif", "mp4-to-gif", "Video"),
  ];
}

function compressionTools(): ToolDef[] {
  return [
    t(ALL_IMAGE, IMAGE_OUTPUT_EXTS, "image", "image-compress", "Compression", true),
    t(["pdf"], ["pdf"], "pdf-compress", "pdf-compress", "Compression"),
    t(VIDEO_EXTS, VIDEO_EXTS, "media", "video-compress", "Compression"),
  ];
}

function utilityTools(): ToolDef[] {
  return [
    t(ALL_IMAGE, ["txt"], "ocr", "image-to-text", "Utilities"),
  ];
}

function genericTools(): ToolDef[] {
  return [
    {
      id: "image-convert",
      slug: "image-convert",
      category: "Images",
      from: ALL_IMAGE,
      to: ANY_IMAGE_TARGET,
      op: "image",
      multi: true,
    },
    {
      id: "audio-convert",
      slug: "audio-convert",
      category: "Audio",
      from: AUDIO_EXTS,
      to: AUDIO_EXTS,
      op: "media",
      multi: true,
    },
    {
      id: "video-convert",
      slug: "video-convert",
      category: "Video",
      from: VIDEO_EXTS,
      to: VIDEO_EXTS,
      op: "media",
      multi: false,
    },
  ];
}

export const TOOLS: ToolDef[] = [
  ...pairTools(),
  ...pdfTools(),
  ...docTools(),
  ...audioTools(),
  ...videoTools(),
  ...compressionTools(),
  ...utilityTools(),
  ...genericTools(),
];

export function getToolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function recommendedTargets(ext: string): { ext: string; available: boolean }[] {
  const canon = extToCanonical(ext);
  const pdfRecs: string[] = [];
  const imageRecs: string[] = [];
  const docRecs: string[] = [];
  const audioRecs: string[] = [];
  const videoRecs: string[] = [];

  // images & pdfs
  if (canon === "pdf") {
    pdfRecs.push("jpg", "png", "webp", "txt");
  } else if (IMAGE_INPUT_EXTS.includes(canon)) {
    imageRecs.push("pdf", "png", "jpg", "webp", "avif");
  } else if (AUDIO_EXTS.includes(canon)) {
    audioRecs.push("mp3", "wav", "flac", "aac", "ogg");
  } else if (VIDEO_EXTS.includes(canon)) {
    videoRecs.push("mp4", "webm", "mov", "mkv", "avi", "mp3");
  } else if (["txt", "csv", "md"].includes(canon)) {
    docRecs.push("pdf");
  } else if (["doc", "docx"].includes(canon)) {
    docRecs.push("pdf", "txt");
  } else if (["xls", "xlsx"].includes(canon)) {
    docRecs.push("pdf", "csv");
  } else if (["ppt", "pptx"].includes(canon)) {
    docRecs.push("pdf");
  }

  const status = computeEngineStatus();
  const can = (fmt: string) => {
    const e = fmt === "pdf" ? status["pdf-lib"] || status.unpdf : fmt === "txt" ? status.unpdf || status.tesseract : status.sharp || status.ffmpeg;
    return e;
  };

  return [...pdfRecs, ...imageRecs, ...docRecs, ...audioRecs, ...videoRecs]
    .filter((v, i, a) => a.indexOf(v) === i && v !== canon)
    .map((ext) => ({ ext, available: can(ext) }));
}

export function availableTargetsFor(fromExt: string): string[] {
  const canon = extToCanonical(fromExt);
  const tool = TOOLS.find((t) => t.from.includes(canon) && t.fixed?.from === canon) ?? TOOLS.find((t) => t.from.includes(canon));
  if (!tool) return [];
  return tool.to.filter((to) => to !== canon);
}
