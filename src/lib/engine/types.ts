import type { Category } from "./formats";

export interface UploadedFileData {
  id: string;
  name: string;
  ext: string;
  mime: string;
  size: number;
  buffer: Buffer;
}

export type QualityPreset = "standard" | "high" | "max";

export interface ConversionSettings {
  target: string;
  quality?: QualityPreset;
  imageQuality?: number;
  width?: number;
  height?: number;
  fit?: "inside" | "cover" | "fill" | "width" | "height";
  background?: string;
  keepMetadata?: boolean;
  dpi?: number;
  pageRange?: string;
  colorMode?: "rgb" | "grayscale" | "bw";
  compression?: "none" | "low" | "medium" | "high";
  pageSize?: "A4" | "A5" | "Letter" | "Legal" | "Original" | "Custom";
  pageWidth?: number;
  pageHeight?: number;
  orientation?: "portrait" | "landscape" | "auto";
  margin?: number;
  rotateDeg?: number;
  password?: string;
  removePassword?: string;
  pageOrder?: number[];
  pagesToDelete?: number[];
  bitrate?: string;
  fps?: number;
  resolution?: string;
  codec?: string;
  audioBitrate?: string;
  sampleRate?: number;
  channels?: number;
  ocrLang?: string;
}

export interface OutputFileData {
  name: string;
  mime: string;
  buffer: Buffer;
  preview?: string;
}

export type ProgressPhase =
  | "preparing"
  | "analyzing"
  | "rendering"
  | "encoding"
  | "extracting";

export interface ProgressEvent {
  phase: ProgressPhase;
  label?: string;
  pct?: number;
  current?: number;
  total?: number;
  file?: string;
  fileIndex?: number;
  fileCount?: number;
}

export type ProgressCb = (evt: ProgressEvent) => void;

export type FileCategory = Category;
