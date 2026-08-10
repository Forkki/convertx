import { sanitizeFilename, baseName, joinName } from "@/lib/utils";

export const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB per file
export const MAX_FILES_PER_JOB = 200;
export const MAX_TOTAL_SIZE = 800 * 1024 * 1024; // 800 MB per job

export class ConversionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function assertFileAllowed(name: string, size: number) {
  if (size > MAX_FILE_SIZE) {
    throw new ConversionError("fileTooBig", `${name} exceeds the ${MAX_FILE_SIZE / 1024 / 1024} MB limit.`);
  }
  if (size <= 0) {
    throw new ConversionError("corrupt", `${name} appears to be empty or corrupted.`);
  }
}

export function sanitizeOutputName(original: string, ext: string): string {
  return sanitizeFilename(joinName(baseName(original), ext));
}

export function clampInt(v: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function parsePageRange(range: string | undefined, total: number): number[] {
  if (!range) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  for (const part of range.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) if (i >= 1 && i <= total) pages.add(i);
    } else if (/^\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (n >= 1 && n <= total) pages.add(n);
    }
  }
  if (pages.size === 0) return Array.from({ length: total }, (_, i) => i + 1);
  return [...pages].sort((a, b) => a - b);
}

export function presetQuality(preset: "standard" | "high" | "max", explicit?: number, dflt = 80): number {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return clampInt(explicit, dflt, 1, 100);
  if (preset === "standard") return Math.min(dflt, 80);
  if (preset === "high") return 90;
  return 96;
}

export function presetCrf(preset: "standard" | "high" | "max"): number {
  if (preset === "standard") return 30;
  if (preset === "high") return 23;
  return 18;
}
