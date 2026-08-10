import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import { sanitizeOutputName, presetCrf, ConversionError } from "./safety";
import type { ConversionSettings, OutputFileData, ProgressCb, UploadedFileData } from "./types";

const ffmpegPath: string = ffmpegStatic ?? "";

const AUDIO_CODECS: Record<string, string[]> = {
  mp3: ["-c:a", "libmp3lame"],
  wav: ["-c:a", "pcm_s16le"],
  flac: ["-c:a", "flac"],
  aac: ["-c:a", "aac"],
  ogg: ["-c:a", "libvorbis"],
  opus: ["-c:a", "libopus"],
  m4a: ["-c:a", "aac"],
};

const VIDEO_CODECS: Record<string, (crf: number, ab: string) => string[]> = {
  mp4: (crf, ab) => ["-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab],
  webm: (crf) => ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf), "-deadline", "good", "-c:a", "libopus"],
  mov: (crf, ab) => ["-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab],
  mkv: (crf, ab) => ["-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-c:a", "aac", "-b:a", ab],
  avi: () => ["-c:v", "mpeg4", "-qscale:v", "3", "-c:a", "libmp3lame"],
  wmv: () => ["-c:v", "wmv2", "-b:v", "2000k", "-c:a", "wmav2"],
};

export function probeDuration(input: string): Promise<number | null> {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, ["-i", input], { windowsHide: true });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", () => {
      const m = err.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m) {
        const [h, mm, s] = [parseInt(m[1], 10), parseInt(m[2], 10), parseFloat(m[3])];
        resolve(h * 3600 + mm * 60 + s);
      } else resolve(null);
    });
    p.on("error", () => resolve(null));
  });
}

function runFfmpeg(args: string[], onProgress?: ProgressCb, totalSeconds?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => {
      stdout += d.toString();
      const lines = stdout.split("\n");
      stdout = lines.pop() ?? "";
      for (const line of lines) {
        const m = line.match(/out_time_us=(\d+)/) ?? line.match(/out_time_ms=(\d+)/);
        if (m) {
          const us = parseInt(m[1], 10);
          const sec = m[0].startsWith("out_time_us=") ? us / 1e6 : us / 1e3;
          if (totalSeconds && totalSeconds > 0) {
            const pct = Math.min(99, Math.round((sec / totalSeconds) * 100));
            onProgress?.({ phase: "encoding", pct });
          }
        }
      }
    });
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else {
        const msg = stderr
          .split("\n")
          .filter((l) => /(Unknown encoder|No such file|not found|Conversion failed|error)/i.test(l))
          .slice(-3)
          .join(" | ")
          .trim();
        reject(new ConversionError("convertFailed", msg || `FFmpeg exited with code ${code}.`));
      }
    });
    p.on("error", (e) => reject(new ConversionError("server", e.message)));
  });
}

async function withTemp(fn: (dir: string) => Promise<OutputFileData>): Promise<OutputFileData> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "convertx-"));
  try {
    return await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function convertMedia(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const target = settings.target;
  const isVideo = ["mp4", "mov", "avi", "mkv", "webm", "wmv"].includes(target);

  return withTemp(async (dir) => {
    const inPath = path.join(dir, "input" + (input.ext ? `.${input.ext}` : ""));
    const outExt = target === "opus" ? "ogg" : target;
    const outPath = path.join(dir, `output.${outExt}`);
    fs.writeFileSync(inPath, input.buffer);

    onProgress?.({ phase: "preparing", label: "Analyzing media…", pct: 5 });
    const duration = await probeDuration(inPath);

    const args: string[] = ["-y", "-i", inPath];
    const ab = settings.audioBitrate && /^\d+k$/.test(settings.audioBitrate) ? settings.audioBitrate : "192k";

    if (isVideo) {
      const crf = settings.quality ? presetCrf(settings.quality) : 26;
      const codecFn = VIDEO_CODECS[target] ?? VIDEO_CODECS.mp4;
      args.push(...codecFn(crf, ab));
      const vf: string[] = [];
      if (settings.resolution && /^\d+x\d+$/.test(settings.resolution)) {
        vf.push(`scale=${settings.resolution}:force_original_aspect_ratio=decrease`);
      }
      if (settings.fps && settings.fps > 0 && settings.fps <= 120) {
        args.push("-r", String(settings.fps));
      }
      if (vf.length) args.push("-vf", vf.join(","));
      if (settings.bitrate && /^\d+k$/.test(settings.bitrate)) {
        args.push("-b:v", settings.bitrate);
      }
    } else {
      const codec = AUDIO_CODECS[target] ?? AUDIO_CODECS.mp3;
      args.push(...codec);
      if ((target === "mp3" || target === "aac" || target === "m4a") && /^\d+k$/.test(ab)) {
        args.push("-b:a", ab);
      }
      if (target === "ogg") args.push("-q:a", "5");
      if (settings.sampleRate && settings.sampleRate > 0) args.push("-ar", String(settings.sampleRate));
      if (settings.channels && settings.channels > 0 && settings.channels <= 8) args.push("-ac", String(settings.channels));
    }

    if (settings.keepMetadata === false) args.push("-map_metadata", "-1");

    args.push("-progress", "pipe:1", "-nostats", outPath);

    await runFfmpeg(args, onProgress, duration ?? undefined);
    onProgress?.({ phase: "encoding", pct: 100 });

    const buffer = fs.readFileSync(outPath);
    return {
      name: sanitizeOutputName(input.name, target),
      mime: isVideo ? videoMime(target) : audioMime(target),
      buffer,
    };
  });
}

export async function extractAudio(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  const target = settings.target;
  return withTemp(async (dir) => {
    const inPath = path.join(dir, "input" + (input.ext ? `.${input.ext}` : ""));
    const outExt = target === "opus" ? "ogg" : target;
    const outPath = path.join(dir, `output.${outExt}`);
    fs.writeFileSync(inPath, input.buffer);

    onProgress?.({ phase: "preparing", label: "Analyzing media…", pct: 5 });
    const duration = await probeDuration(inPath);

    const args = ["-y", "-i", inPath, "-vn"];
    const codec = AUDIO_CODECS[target] ?? AUDIO_CODECS.mp3;
    args.push(...codec);
    const ab = settings.audioBitrate && /^\d+k$/.test(settings.audioBitrate) ? settings.audioBitrate : "192k";
    if ((target === "mp3" || target === "aac" || target === "m4a") && /^\d+k$/.test(ab)) args.push("-b:a", ab);
    if (target === "ogg") args.push("-q:a", "5");
    if (settings.sampleRate && settings.sampleRate > 0) args.push("-ar", String(settings.sampleRate));
    if (settings.channels && settings.channels > 0 && settings.channels <= 8) args.push("-ac", String(settings.channels));
    args.push("-progress", "pipe:1", "-nostats", outPath);

    await runFfmpeg(args, onProgress, duration ?? undefined);
    onProgress?.({ phase: "encoding", pct: 100 });

    const buffer = fs.readFileSync(outPath);
    return {
      name: sanitizeOutputName(`${input.name.replace(/\.[^.]+$/, "")}-audio`, target),
      mime: audioMime(target),
      buffer,
    };
  });
}

export async function videoToGif(
  input: UploadedFileData,
  settings: ConversionSettings,
  onProgress?: ProgressCb
): Promise<OutputFileData> {
  return withTemp(async (dir) => {
    const inPath = path.join(dir, "input" + (input.ext ? `.${input.ext}` : ""));
    const outPath = path.join(dir, "output.gif");
    fs.writeFileSync(inPath, input.buffer);
    onProgress?.({ phase: "preparing", label: "Analyzing media…", pct: 5 });
    const duration = await probeDuration(inPath);

    const args = [
      "-y", "-i", inPath,
      "-vf", "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
      "-loop", "0",
      "-progress", "pipe:1", "-nostats",
      outPath,
    ];
    await runFfmpeg(args, onProgress, duration ?? undefined);
    onProgress?.({ phase: "encoding", pct: 100 });
    return {
      name: sanitizeOutputName(input.name.replace(/\.[^.]+$/, ""), "gif"),
      mime: "image/gif",
      buffer: fs.readFileSync(outPath),
    };
  });
}

function audioMime(ext: string): string {
  const map: Record<string, string> = { mp3: "audio/mpeg", wav: "audio/wav", flac: "audio/flac", aac: "audio/aac", ogg: "audio/ogg", opus: "audio/ogg", m4a: "audio/mp4" };
  return map[ext] ?? "application/octet-stream";
}

function videoMime(ext: string): string {
  const map: Record<string, string> = { mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", mkv: "video/x-matroska", webm: "video/webm", wmv: "video/x-ms-wmv" };
  return map[ext] ?? "application/octet-stream";
}
