import { useSyncExternalStore } from "react";
import type { ConversionSettings } from "@/lib/engine/types";
import type { AnalyzeResult } from "@/lib/engine/analyze";
import { analyzeFiles, convertStream, type ClientFileInput, type OutputPayload } from "@/lib/api";
import { addHistory, type HistoryRecord } from "./history-store";
import { uid, baseExt, formatBytes } from "@/lib/utils";

export type Stage = "idle" | "ready" | "converting" | "done" | "error";

export interface WorkspaceFile {
  id: string;
  name: string;
  size: number;
  file: File;
  meta?: AnalyzeResult;
  status: "pending" | "analyzed" | "converting" | "done" | "failed";
  error?: string;
  previewUrl?: string;
}

export interface OutputRecord {
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  preview?: string;
}

export interface ProgressState {
  pct: number;
  label?: string;
  file?: string;
  fileIndex: number;
  fileCount: number;
  current?: number;
  total?: number;
  etaMs?: number;
}

export interface ResultState {
  jobId: string;
  outputs: OutputRecord[];
  zip?: OutputRecord;
  sourceTotal: number;
  outputTotal: number;
  count: number;
  durationMs: number;
  quality: string;
  toolId: string;
  target: string;
  sourceName: string;
  sourceExt: string;
  category: string;
}

export interface WorkspaceError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface WorkspaceState {
  stage: Stage;
  files: WorkspaceFile[];
  target: string;
  settings: ConversionSettings;
  progress: ProgressState;
  result?: ResultState;
  error?: WorkspaceError;
  busyAnalyzing: boolean;
  toolId: string;
}

export const defaultSettings = (): ConversionSettings => ({
  target: "",
  quality: "high",
  imageQuality: 90,
  keepMetadata: false,
  dpi: 150,
  pageRange: "",
  colorMode: "rgb",
  compression: "medium",
  pageSize: "Original",
  orientation: "auto",
  margin: 0,
  rotateDeg: 90,
  audioBitrate: "192k",
  fps: 30,
  resolution: "1280x720",
  ocrLang: "eng",
});

type Listener = () => void;

let state: WorkspaceState = {
  stage: "idle",
  files: [],
  target: "",
  settings: defaultSettings(),
  progress: { pct: 0, fileIndex: 0, fileCount: 0 },
  busyAnalyzing: false,
  toolId: "image-convert",
};

const listeners = new Set<Listener>();

function setState(patch: Partial<WorkspaceState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let abortController: AbortController | null = null;

export const workspaceStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  getState() {
    return state;
  },
};

export function useWorkspace() {
  return useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot, workspaceStore.getSnapshot);
}

export function setTool(toolId: string, target = "") {
  setState({ toolId, target, result: undefined, error: undefined });
}

export function resetWorkspace() {
  abortController?.abort();
  abortController = null;
  state = {
    stage: "idle",
    files: [],
    target: "",
    settings: defaultSettings(),
    progress: { pct: 0, fileIndex: 0, fileCount: 0 },
    busyAnalyzing: false,
    toolId: state.toolId,
  };
  listeners.forEach((l) => l());
}

function isPreviewable(type: string): boolean {
  return type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/");
}

export function resolveToolId(files: WorkspaceFile[], target: string): string {
  const cat = files[0]?.meta?.category;
  if (!cat) return "image-convert";
  if (cat === "image") return target === "pdf" ? "images-to-pdf" : "image-convert";
  if (cat === "pdf") return target === "txt" ? "pdf-to-text" : "pdf-to-jpg";
  if (cat === "audio") return "audio-convert";
  if (cat === "video") {
    if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"].includes(target)) return target === "wav" ? "video-to-wav" : "video-to-mp3";
    if (target === "gif") return "mp4-to-gif";
    return "video-convert";
  }
  if (cat === "text") return "txt-to-pdf";
  if (cat === "document") return "docx-to-pdf";
  return "image-convert";
}

export async function addFiles(files: File[], toolId?: string) {
  const existing = new Set(state.files.map((f) => `${f.name}:${f.size}`));
  const fresh = files.filter((f) => !existing.has(`${f.name}:${f.size}`));
  if (!fresh.length) return;

  const newFiles: WorkspaceFile[] = fresh.map((file) => ({
    id: uid("f"),
    name: file.name,
    size: file.size,
    file,
    status: "pending",
    previewUrl: isPreviewable(file.type) ? URL.createObjectURL(file) : undefined,
  }));

  setState({
    files: [...state.files, ...newFiles],
    busyAnalyzing: true,
    stage: "ready",
    result: undefined,
    error: undefined,
    ...(toolId ? { toolId } : {}),
  });

  const inputs: ClientFileInput[] = newFiles.map((f) => ({ id: f.id, file: f.file }));
  try {
    const metaMap = await analyzeFiles(inputs);
    setState({
      files: state.files.map((f) => {
        const meta = metaMap[f.id];
        return meta
          ? { ...f, meta, status: "analyzed" as const, error: undefined }
          : { ...f, status: "failed" as const, error: "Could not identify file type" };
      }),
      busyAnalyzing: false,
    });
  } catch {
    setState({
      busyAnalyzing: false,
      stage: "error",
      error: { code: "generic", message: "Could not analyze files.", retryable: true },
    });
  }
}

export function removeFile(id: string) {
  const file = state.files.find((f) => f.id === id);
  if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
  const files = state.files.filter((f) => f.id !== id);
  setState({ files, stage: files.length ? "ready" : "idle" });
}

export function reorderFiles(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;
  const files = [...state.files];
  const [moved] = files.splice(fromIndex, 1);
  files.splice(toIndex, 0, moved);
  setState({ files });
}

export function setTarget(target: string) {
  setState({ target });
}

export function updateSettings(patch: Partial<ConversionSettings>) {
  setState({ settings: { ...state.settings, ...patch } });
}

export function cancelConversion() {
  abortController?.abort();
  abortController = null;
  setState({
    stage: "ready",
    progress: { pct: 0, fileIndex: 0, fileCount: 0 },
    files: state.files.map((f) => ({ ...f, status: "analyzed" as const })),
  });
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function payloadToRecord(p: OutputPayload): OutputRecord {
  const bytes = base64ToUint8(p.data);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return {
    name: p.name,
    mime: p.mime,
    size: p.size,
    preview: p.preview,
    blob: new Blob([copy], { type: p.mime }),
  };
}

export async function startConversion() {
  if (!state.files.length || state.stage === "converting") return;
  if (!state.target) {
    setState({ stage: "error", error: { code: "chooseTarget", message: "Choose a target format first.", retryable: true } });
    return;
  }

  const startTime = Date.now();
  const toolId = resolveToolId(state.files, state.target);
  const target = state.target;
  const settings: ConversionSettings = { ...state.settings, target };
  const inputs: ClientFileInput[] = state.files.map((f) => ({ id: f.id, file: f.file }));

  abortController = new AbortController();
  const signal = abortController.signal;

  setState({
    stage: "converting",
    error: undefined,
    progress: { pct: 2, label: "Preparing…", fileIndex: 0, fileCount: inputs.length },
    files: state.files.map((f) => ({ ...f, status: "converting" as const })),
  });

  let payloadOutputs: OutputPayload[] = [];
  let payloadZip: OutputPayload | undefined;

  try {
    await convertStream(
      inputs,
      toolId,
      target,
      settings,
      (evt) => {
        if (evt.type === "progress") {
          const fileCount = evt.fileCount ?? inputs.length;
          const overall = fileCount ? ((evt.fileIndex ?? 0) * 100 + (evt.pct ?? 0)) / fileCount : evt.pct ?? 0;
          const elapsed = Date.now() - startTime;
          const etaMs = overall > 3 && overall < 99 ? Math.round((elapsed * (100 - overall)) / overall) : undefined;
          setState({
            progress: {
              pct: Math.min(99.5, overall),
              label: evt.label,
              file: evt.file,
              fileIndex: evt.fileIndex ?? 0,
              fileCount,
              current: evt.current,
              total: evt.total,
              etaMs,
            },
          });
        } else if (evt.type === "result") {
          payloadOutputs = evt.outputs;
          payloadZip = evt.zip;
        }
      },
      signal
    );
  } catch (e) {
    if (signal.aborted) {
      cancelConversion();
      return;
    }
    const message = e instanceof Error ? e.message : "Conversion failed";
    setState({
      stage: "error",
      files: state.files.map((f) => ({ ...f, status: "failed" as const })),
      error: { code: "convertFailed", message, retryable: true },
    });
    return;
  }

  if (!payloadOutputs.length) {
    setState({ stage: "error", error: { code: "server", message: "No output was produced.", retryable: true } });
    return;
  }

  const durationMs = Date.now() - startTime;
  const outputs = payloadOutputs.map(payloadToRecord);
  const zip = payloadZip ? payloadToRecord(payloadZip) : undefined;
  const sourceTotal = state.files.reduce((s, f) => s + f.size, 0);
  const outputTotal = outputs.reduce((s, o) => s + o.size, 0);
  const jobId = uid("job");
  const first = state.files[0];

  const result: ResultState = {
    jobId,
    outputs,
    zip,
    sourceTotal,
    outputTotal,
    count: outputs.length,
    durationMs,
    quality: qualityLabel(state.settings.quality ?? "high"),
    toolId,
    target,
    sourceName: first?.name ?? "file",
    sourceExt: first?.meta?.ext ?? baseExt(first?.name ?? ""),
    category: first?.meta?.category ?? "image",
  };

  setState({
    stage: "done",
    result,
    progress: { pct: 100, fileIndex: inputs.length - 1, fileCount: inputs.length },
    files: state.files.map((f) => ({ ...f, status: "done" as const })),
  });

  const record: HistoryRecord = {
    id: jobId,
    sourceName: result.sourceName,
    sourceExt: result.sourceExt,
    sourceSize: sourceTotal,
    category: result.category,
    toolId,
    target,
    fromLabel: result.sourceExt.toUpperCase(),
    toLabel: target.toUpperCase(),
    date: Date.now(),
    durationMs,
    outputCount: outputs.length,
    outputTotal,
    outputs,
    zip,
    status: "done",
  };
  addHistory(record).catch(() => undefined);
}

function qualityLabel(q: string): string {
  if (q === "max") return "Maximum";
  if (q === "standard") return "Standard";
  return "High";
}

export function downloadOutput(output: OutputRecord) {
  const url = URL.createObjectURL(output.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = output.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadAllOutputs() {
  state.result?.outputs.forEach((o) => downloadOutput(o));
}

export function downloadZipOutput() {
  if (state.result?.zip) downloadOutput(state.result.zip);
}

export function formatMeta(m: AnalyzeResult | undefined): string {
  if (!m) return "";
  if (m.category === "image" && m.width && m.height) return `${m.width} × ${m.height} px`;
  if (m.category === "pdf") return `${m.pages ?? "?"} pages`;
  if (m.duration !== undefined) return `${Math.round(m.duration)}s`;
  return formatBytes(m.size);
}
