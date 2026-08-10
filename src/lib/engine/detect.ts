import { FORMATS, extToCanonical, getFormat, type Category } from "./formats";

export interface DetectedFormat {
  ext: string;
  name: string;
  mime: string;
  category: Category;
  confidence: "magic" | "extension" | "text";
}

function ascii(buf: Uint8Array, offset: number, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    const c = buf[offset + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

export function detectByMagic(buf: Uint8Array): string | null {
  if (buf.length < 12) return null;

  if (ascii(buf, 0, 5) === "%PDF-") return "pdf";

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (ascii(buf, 0, 4) === "GIF8") return "gif";
  if (ascii(buf, 0, 2) === "BM") return "bmp";
  if (ascii(buf, 0, 4) === "II*\u0000") return "tiff";
  if (ascii(buf, 0, 4) === "MM\u0000*") return "tiff";

  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 4) === "WEBP") return "webp";
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 4) === "WAVE") return "wav";
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 4) === "AVI ") return "avi";

  if (ascii(buf, 4, 4) === "ftyp") {
    const brand = ascii(buf, 8, 4).toLowerCase();
    if (["avif", "avis", "av01"].includes(brand)) return "avif";
    if (["heic", "heix", "hevc", "mif1", "msf1", "hevx"].includes(brand)) return "heic";
    if (["isom", "mp42", "mp41", "avc1", "mp4v", "dash", "mmp4", "ndas", "iso2", "iso4", "iso5", "iso6"].includes(brand)) return "mp4";
    if (["m4a ", "m4b ", "mp4a"].includes(brand)) return "m4a";
    if (brand === "qt  " || brand === "mov ") return "mov";
    return "mp4";
  }

  if (ascii(buf, 0, 4) === "fLaC") return "flac";
  if (ascii(buf, 0, 4) === "OggS") {
    const next = buf[28];
    if (next === 0x01) return "ogg";
    if (next === 0x80) return "ogg";
    return "ogg";
  }

  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    // EBML — mkv or webm (checked by extension later or doc type)
    return "mkv";
  }

  if (ascii(buf, 0, 3) === "ID3") return "mp3";
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "mp3";

  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return "doc"; // OLE2
  if (ascii(buf, 0, 4) === "PK\u0003\u0004") {
    const ct = ascii(buf, 30, 18);
    if (ct.includes("[Content_Types].xml") || ct.includes("word/")) {
      // deeper check below
      const all = ascii(buf, 0, Math.min(buf.length, 4000));
      if (all.includes("word/")) return "docx";
      if (all.includes("xl/")) return "xlsx";
      if (all.includes("ppt/")) return "pptx";
      return "zip";
    }
    return "zip";
  }
  if (ascii(buf, 0, 5) === "{\\rtf") return "rtf";

  const head = ascii(buf, 0, Math.min(buf.length, 200));
  if (head.trimStart().startsWith("<svg") || head.includes("<svg ")) return "svg";

  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0xba) return "mpg";

  return null;
}

const TEXT_EXTS = new Set(["txt", "csv", "md", "html", "htm", "json", "xml", "log"]);
const OFFICE_EXTS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "html", "htm"]);

export function detectFormat(buf: Uint8Array, filename: string): DetectedFormat {
  const ext = extToCanonical(filename.split(".").pop() ?? "");
  const magic = detectByMagic(buf);

  if (magic) {
    const canon = extToCanonical(magic);
    const fmt = getFormat(canon);
    if (fmt) {
      return { ext: canon, name: fmt.name, mime: fmt.mime, category: fmt.category, confidence: "magic" };
    }
  }

  // Extension fallback
  const fmt = getFormat(ext);
  if (fmt) return { ext, name: fmt.name, mime: fmt.mime, category: fmt.category, confidence: "extension" };

  // Text heuristics
  if (magic === "zip" && OFFICE_EXTS.has(ext)) {
    const f = FORMATS[ext];
    return { ext, name: f.name, mime: f.mime, category: f.category, confidence: "extension" };
  }

  if (buf.length > 0) {
    const printable = buf.filter((b) => b === 0x0a || b === 0x0d || b === 0x09 || (b >= 0x20 && b < 0x7f)).length;
    if (printable / buf.length > 0.8 && TEXT_EXTS.has(ext)) {
      const f = FORMATS[ext];
      return { ext, name: f.name, mime: f.mime, category: f.category, confidence: "text" };
    }
  }

  if (TEXT_EXTS.has(ext)) {
    const f = FORMATS[ext];
    return { ext, name: f.name, mime: f.mime, category: f.category, confidence: "extension" };
  }

  return { ext: "bin", name: "Unknown", mime: "application/octet-stream", category: "text", confidence: "extension" };
}
