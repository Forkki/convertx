import type { ConversionSettings } from "@/lib/engine/types";
import type { AnalyzeResult } from "@/lib/engine/analyze";

export interface ClientFileInput {
  id: string;
  file: File;
}

export interface OutputPayload {
  name: string;
  mime: string;
  size: number;
  data: string;
  preview?: string;
}

export interface ConvertResult {
  outputs: OutputPayload[];
  zip?: OutputPayload;
}

export type ConvertEvent =
  | ({ type: "progress" } & Partial<{
      phase: string;
      label: string;
      pct: number;
      current: number;
      total: number;
      file: string;
      fileIndex: number;
      fileCount: number;
    }>)
  | { type: "result"; outputs: OutputPayload[]; zip?: OutputPayload }
  | { type: "error"; code: string; message: string };

export async function analyzeFiles(inputs: ClientFileInput[]): Promise<Record<string, AnalyzeResult>> {
  const form = new FormData();
  inputs.forEach((i, idx) => {
    form.append("files", i.file, i.file.name);
    form.append(`id-${idx}`, i.id);
  });
  const res = await fetch("/api/analyze", { method: "POST", body: form });
  if (!res.ok) {
    let msg = "Analysis failed";
    try {
      const j = await res.json();
      msg = j.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const json = await res.json();
  const map: Record<string, AnalyzeResult> = {};
  for (const f of json.files ?? []) map[f.id] = f;
  return map;
}

export async function convertStream(
  inputs: ClientFileInput[],
  toolId: string,
  target: string,
  settings: ConversionSettings,
  onEvent: (e: ConvertEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const form = new FormData();
  inputs.forEach((i) => form.append("files", i.file, i.file.name));
  form.append("config", JSON.stringify({ toolId, target, settings }));

  const res = await fetch("/api/convert", { method: "POST", body: form, signal });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  if (!res.body) throw new Error("No response stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let evt: ConvertEvent;
        try {
          evt = JSON.parse(line);
        } catch {
          continue;
        }
        onEvent(evt);
        if (evt.type === "error") throw new Error(evt.message);
      }
    }
    if (buf.trim()) {
      try {
        onEvent(JSON.parse(buf));
      } catch {
        /* ignore */
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

export async function fetchCapabilities(): Promise<{
  tools: { slug: string; available: boolean }[];
  limits: { maxFileSize: number; maxFilesPerJob: number; maxTotalSize: number };
}> {
  const res = await fetch("/api/capabilities", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load capabilities");
  return res.json();
}
