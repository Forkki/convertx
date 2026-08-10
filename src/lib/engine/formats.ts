export type Category = "image" | "pdf" | "document" | "audio" | "video" | "text";
export type Engine = "sharp" | "pdf-lib" | "unpdf" | "ffmpeg" | "tesseract" | "libreoffice" | "none";

export interface FormatDef {
  ext: string;
  name: string;
  mime: string;
  category: Category;
  engine: Engine;
}

export const FORMATS: Record<string, FormatDef> = {
  jpg: { ext: "jpg", name: "JPEG", mime: "image/jpeg", category: "image", engine: "sharp" },
  jpeg: { ext: "jpeg", name: "JPEG", mime: "image/jpeg", category: "image", engine: "sharp" },
  png: { ext: "png", name: "PNG", mime: "image/png", category: "image", engine: "sharp" },
  webp: { ext: "webp", name: "WebP", mime: "image/webp", category: "image", engine: "sharp" },
  gif: { ext: "gif", name: "GIF", mime: "image/gif", category: "image", engine: "sharp" },
  bmp: { ext: "bmp", name: "BMP", mime: "image/bmp", category: "image", engine: "sharp" },
  tiff: { ext: "tiff", name: "TIFF", mime: "image/tiff", category: "image", engine: "sharp" },
  tif: { ext: "tif", name: "TIFF", mime: "image/tiff", category: "image", engine: "sharp" },
  avif: { ext: "avif", name: "AVIF", mime: "image/avif", category: "image", engine: "sharp" },
  svg: { ext: "svg", name: "SVG", mime: "image/svg+xml", category: "image", engine: "sharp" },
  heic: { ext: "heic", name: "HEIC", mime: "image/heic", category: "image", engine: "sharp" },
  heif: { ext: "heif", name: "HEIF", mime: "image/heif", category: "image", engine: "sharp" },
  ico: { ext: "ico", name: "ICO", mime: "image/x-icon", category: "image", engine: "sharp" },

  pdf: { ext: "pdf", name: "PDF", mime: "application/pdf", category: "pdf", engine: "unpdf" },

  doc: { ext: "doc", name: "Word (DOC)", mime: "application/msword", category: "document", engine: "none" },
  docx: { ext: "docx", name: "Word (DOCX)", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "document", engine: "none" },
  xls: { ext: "xls", name: "Excel (XLS)", mime: "application/vnd.ms-excel", category: "document", engine: "none" },
  xlsx: { ext: "xlsx", name: "Excel (XLSX)", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "document", engine: "none" },
  ppt: { ext: "ppt", name: "PowerPoint (PPT)", mime: "application/vnd.ms-powerpoint", category: "document", engine: "none" },
  pptx: { ext: "pptx", name: "PowerPoint (PPTX)", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", category: "document", engine: "none" },
  odt: { ext: "odt", name: "OpenDocument (ODT)", mime: "application/vnd.oasis.opendocument.text", category: "document", engine: "none" },
  ods: { ext: "ods", name: "OpenDocument (ODS)", mime: "application/vnd.oasis.opendocument.spreadsheet", category: "document", engine: "none" },
  odp: { ext: "odp", name: "OpenDocument (ODP)", mime: "application/vnd.oasis.opendocument.presentation", category: "document", engine: "none" },
  rtf: { ext: "rtf", name: "RTF", mime: "application/rtf", category: "document", engine: "none" },
  html: { ext: "html", name: "HTML", mime: "text/html", category: "document", engine: "none" },
  htm: { ext: "htm", name: "HTML", mime: "text/html", category: "document", engine: "none" },
  md: { ext: "md", name: "Markdown", mime: "text/markdown", category: "text", engine: "none" },
  csv: { ext: "csv", name: "CSV", mime: "text/csv", category: "text", engine: "none" },
  txt: { ext: "txt", name: "Plain text", mime: "text/plain", category: "text", engine: "none" },

  mp3: { ext: "mp3", name: "MP3", mime: "audio/mpeg", category: "audio", engine: "ffmpeg" },
  wav: { ext: "wav", name: "WAV", mime: "audio/wav", category: "audio", engine: "ffmpeg" },
  flac: { ext: "flac", name: "FLAC", mime: "audio/flac", category: "audio", engine: "ffmpeg" },
  aac: { ext: "aac", name: "AAC", mime: "audio/aac", category: "audio", engine: "ffmpeg" },
  ogg: { ext: "ogg", name: "OGG", mime: "audio/ogg", category: "audio", engine: "ffmpeg" },
  m4a: { ext: "m4a", name: "M4A", mime: "audio/mp4", category: "audio", engine: "ffmpeg" },
  opus: { ext: "opus", name: "Opus", mime: "audio/ogg", category: "audio", engine: "ffmpeg" },

  mp4: { ext: "mp4", name: "MP4", mime: "video/mp4", category: "video", engine: "ffmpeg" },
  mov: { ext: "mov", name: "MOV", mime: "video/quicktime", category: "video", engine: "ffmpeg" },
  avi: { ext: "avi", name: "AVI", mime: "video/x-msvideo", category: "video", engine: "ffmpeg" },
  mkv: { ext: "mkv", name: "MKV", mime: "video/x-matroska", category: "video", engine: "ffmpeg" },
  webm: { ext: "webm", name: "WebM", mime: "video/webm", category: "video", engine: "ffmpeg" },
  wmv: { ext: "wmv", name: "WMV", mime: "video/x-ms-wmv", category: "video", engine: "ffmpeg" },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  image: "image",
  pdf: "pdf",
  document: "document",
  audio: "audio",
  video: "video",
  text: "text",
};

export function getFormat(ext: string): FormatDef | undefined {
  return FORMATS[ext.toLowerCase().replace(/^\./, "")];
}

export function readableBy(ext: string): boolean {
  const f = getFormat(ext);
  return !!f;
}

export const IMAGE_INPUT_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg", "heic", "heif", "ico"];
export const IMAGE_OUTPUT_EXTS = ["jpg", "png", "webp", "gif", "bmp", "tiff", "avif"];
export const PDF_EXTS = ["pdf"];
export const AUDIO_EXTS = ["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"];
export const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm", "wmv"];
export const TEXT_EXTS = ["txt", "csv", "md"];
export const OFFICE_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "html", "htm"];

export function extToCanonical(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "jpeg") return "jpg";
  if (e === "tif") return "tiff";
  if (e === "htm") return "html";
  if (e === "heif") return "heic";
  return e;
}
