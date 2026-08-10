export type ClientCategory = "image" | "pdf" | "document" | "audio" | "video" | "text" | "unknown";

export const CLIENT_IMAGE_OUTPUT = ["jpg", "png", "webp", "gif", "bmp", "tiff", "avif"];
export const CLIENT_AUDIO = ["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"];
export const CLIENT_VIDEO = ["mp4", "mov", "avi", "mkv", "webm", "wmv"];
export const CLIENT_TEXT = ["txt", "csv", "md"];

const IMAGE_INPUT = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg", "heic", "heif", "ico"];

export function extToCanonical(ext: string): string {
  const e = (ext || "").toLowerCase().replace(/^\./, "");
  if (e === "jpeg") return "jpg";
  if (e === "tif") return "tiff";
  if (e === "htm") return "html";
  if (e === "heif") return "heic";
  return e;
}

export function extCategory(ext: string): ClientCategory {
  const e = extToCanonical(ext);
  if (e === "pdf") return "pdf";
  if (IMAGE_INPUT.includes(e)) return "image";
  if (CLIENT_AUDIO.includes(e)) return "audio";
  if (CLIENT_VIDEO.includes(e)) return "video";
  if (CLIENT_TEXT.includes(e)) return "text";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "html"].includes(e)) return "document";
  return "unknown";
}

export function suggestedTargets(ext: string): string[] {
  const canon = extToCanonical(ext);
  if (canon === "pdf") return ["jpg", "png", "webp", "txt"];
  if (IMAGE_INPUT.includes(canon)) return ["pdf", "png", "jpg", "webp", "avif"];
  if (CLIENT_AUDIO.includes(canon)) return ["mp3", "wav", "flac", "aac", "ogg"];
  if (CLIENT_VIDEO.includes(canon)) return ["mp4", "webm", "mov", "mkv", "avi", "mp3"];
  if (CLIENT_TEXT.includes(canon)) return ["pdf"];
  if (["doc", "docx"].includes(canon)) return ["pdf", "txt"];
  if (["xls", "xlsx"].includes(canon)) return ["pdf", "csv"];
  if (["ppt", "pptx"].includes(canon)) return ["pdf"];
  return [];
}

export function allTargetsFor(category: ClientCategory, currentExt: string): string[] {
  const canon = extToCanonical(currentExt);
  switch (category) {
    case "image":
      return ["pdf", ...CLIENT_IMAGE_OUTPUT].filter((e) => e !== canon);
    case "pdf":
      return ["jpg", "png", "webp", "tiff", "txt"].filter((e) => e !== canon);
    case "audio":
      return CLIENT_AUDIO.filter((e) => e !== canon);
    case "video":
      return [...CLIENT_VIDEO, "mp3", "wav", "gif"].filter((e) => e !== canon);
    case "text":
      return ["pdf"].filter((e) => e !== canon);
    default:
      return [];
  }
}

const LOSSY = new Set(["jpg", "mp3", "aac", "ogg", "m4a", "opus", "webp", "avif"]);

export function isLossyTarget(ext: string): boolean {
  return LOSSY.has(extToCanonical(ext));
}

export function extLabel(ext: string): string {
  return extToCanonical(ext).toUpperCase();
}
