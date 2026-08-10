import fs from "fs";
import path from "path";
import type { Engine } from "./formats";

let cached: Record<string, boolean> | null = null;

function dirExists(pkg: string): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), "node_modules", pkg)).isDirectory();
  } catch {
    return false;
  }
}

function ffmpegBinaryExists(): boolean {
  const bin = path.join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  try {
    return fs.existsSync(bin);
  } catch {
    return false;
  }
}

export function computeEngineStatus(): Record<string, boolean> {
  if (cached) return cached;

  cached = {
    sharp: dirExists("sharp"),
    "pdf-lib": dirExists("pdf-lib"),
    unpdf: dirExists("unpdf"),
    ffmpeg: ffmpegBinaryExists(),
    tesseract: dirExists("tesseract.js"),
    jszip: dirExists("jszip"),
    libreoffice: false,
  };
  return cached;
}

export interface EngineStatus {
  id: Engine;
  available: boolean;
  label: string;
  detail: string;
}

export function getEngineStatusList(): EngineStatus[] {
  const s = computeEngineStatus();
  return [
    { id: "sharp", available: s.sharp, label: "Sharp (image engine)", detail: s.sharp ? "ready" : "missing" },
    { id: "pdf-lib", available: s["pdf-lib"], label: "pdf-lib (PDF builder)", detail: s["pdf-lib"] ? "ready" : "missing" },
    { id: "unpdf", available: s.unpdf, label: "unPDF (PDF renderer)", detail: s.unpdf ? "ready" : "missing" },
    { id: "ffmpeg", available: s.ffmpeg, label: "FFmpeg (audio/video)", detail: s.ffmpeg ? "ready" : "missing" },
    { id: "tesseract", available: s.tesseract, label: "Tesseract (OCR)", detail: s.tesseract ? "ready" : "needs network for language model" },
    { id: "libreoffice", available: s.libreoffice, label: "LibreOffice (office docs)", detail: "not installed" },
  ];
}
