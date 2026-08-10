import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(decimals).replace(/\.0$/, "")} ${sizes[i]}`;
}

export function baseExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return cleaned || "file";
}

export function joinName(base: string, ext: string): string {
  return `${base}.${ext.replace(/^\./, "")}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "–";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function formatDate(ts: number, lang: "th" | "en"): string {
  const date = new Date(ts);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: lang === "th" ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", opts).format(date);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function base64ToBlob(base64: string, mime = "application/octet-stream"): Promise<Blob> {
  const res = await fetch(`data:${mime};base64,${base64}`);
  return res.blob();
}
