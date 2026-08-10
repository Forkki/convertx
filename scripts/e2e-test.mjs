import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ffmpegPath from "ffmpeg-static";

const BASE = "http://localhost:3001";
const OUT = path.join(os.tmpdir(), "convertx-e2e");

fs.mkdirSync(OUT, { recursive: true });

async function makeJpg() {
  const svg = Buffer.from(
    `<svg width="640" height="400" xmlns="http://www.w3.org/2000/svg">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#0EA5E9"/>
       </linearGradient></defs>
       <rect width="640" height="400" fill="url(#g)"/>
       <rect x="40" y="40" width="120" height="120" rx="16" fill="#FBBF24"/>
       <circle cx="520" cy="300" r="70" fill="#F472B6"/>
     </svg>`
  );
  const png = await sharp(svg).png().toBuffer();
  const jpg = await sharp(png).jpeg({ quality: 90 }).toBuffer();
  const pngFile = path.join(OUT, "gradient.png");
  const jpgFile = path.join(OUT, "gradient.jpg");
  fs.writeFileSync(pngFile, png);
  fs.writeFileSync(jpgFile, jpg);
  return { pngFile, jpgFile };
}

async function makePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([420, 594]);
    page.drawText(`ConvertX test page ${i}`, { x: 50, y: 500, size: 24, font, color: rgb(0.2, 0.2, 0.8) });
    page.drawRectangle({ x: 50, y: 420, width: 300, height: 40, color: rgb(0.9, 0.9, 0.4) });
    page.drawText(`Content line ${i} — PDF engine check`, { x: 60, y: 432, size: 12, font });
  }
  const pdfFile = path.join(OUT, "sample.pdf");
  fs.writeFileSync(pdfFile, await doc.save());
  return pdfFile;
}

async function makeOcrImage() {
  const svg = Buffer.from(
    `<svg width="800" height="300" xmlns="http://www.w3.org/2000/svg">
       <rect width="800" height="300" fill="white"/>
       <text x="40" y="180" font-family="sans-serif" font-size="120" fill="black" font-weight="bold">HELLO 123</text>
     </svg>`
  );
  const png = await sharp(svg).png().toBuffer();
  const file = path.join(OUT, "ocr-text.png");
  fs.writeFileSync(file, png);
  return file;
}

async function makeAudio() {
  const wavFile = path.join(OUT, "tone.wav");
  execFileSync(ffmpegPath, ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1.5", "-ar", "44100", "-ac", "2", wavFile]);
  return wavFile;
}

async function makeMp4() {
  const mp4File = path.join(OUT, "clip.mp4");
  execFileSync(ffmpegPath, [
    "-y", "-f", "lavfi", "-i", "testsrc=duration=1.5:size=320x240:rate=24",
    "-f", "lavfi", "-i", "sine=frequency=330:duration=1.5",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", mp4File,
  ]);
  return mp4File;
}

async function postAnalyze(files) {
  const fd = new FormData();
  for (const f of files) fd.append("files", new Blob([fs.readFileSync(f)]), path.basename(f));
  const res = await fetch(`${BASE}/api/analyze`, { method: "POST", body: fd });
  return { status: res.status, body: await res.json() };
}

async function postConvert(files, toolId, target, settings = {}) {
  const fd = new FormData();
  for (const f of files) fd.append("files", new Blob([fs.readFileSync(f)]), path.basename(f));
  fd.append("config", JSON.stringify({ toolId, target, settings }));
  const res = await fetch(`${BASE}/api/convert`, { method: "POST", body: fd });
  const text = await res.text();
  const lines = text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const result = lines.find((l) => l.type === "result");
  const error = lines.find((l) => l.type === "error");
  return { status: res.status, lines, result, error };
}

function summarize(label, r, expectedCode) {
  if (r.status !== 200) return `  [FAIL] ${label}: HTTP ${r.status}`;
  if (r.error) {
    if (expectedCode && r.error.code === expectedCode) {
      return `  [OK]   ${label}: expected error code=${r.error.code} (${r.error.message})`;
    }
    return `  [FAIL] ${label}: error code=${r.error.code} msg=${r.error.message}`;
  }
  const outs = r.result?.outputs ?? [];
  const sizes = outs.map((o) => `${o.name}=${(o.size / 1024).toFixed(1)}KB`).join(", ");
  return `  [OK]   ${label}: ${outs.length} outputs [${sizes}] progress=${r.lines.filter((l) => l.type === "progress").length}`;
}

let failures = 0;
const results = [];
function record(label, r, expectedCode) {
  const line = summarize(label, r, expectedCode);
  results.push(line);
  if (line.includes("[FAIL]")) failures++;
}

console.log("Generating test fixtures…");
const { jpgFile, pngFile } = await makeJpg();
const pdfFile = await makePdf();
const ocrFile = await makeOcrImage();
const wavFile = await makeAudio();
const mp4File = await makeMp4();
const txtFile = path.join(OUT, "sample.txt");
fs.writeFileSync(txtFile, "Hello ConvertX\nSecond line of text\nEnd.");
const fakeDocx = path.join(OUT, "fake.docx");
fs.writeFileSync(fakeDocx, Buffer.from("PK fake docx placeholder"));
console.log("  fixtures in", OUT);

console.log("\n1. Analyze");
let r = await postAnalyze([jpgFile]);
console.log("  jpg ->", JSON.stringify(r.body));
r = await postAnalyze([pdfFile]);
console.log("  pdf ->", JSON.stringify(r.body));
r = await postAnalyze([wavFile]);
console.log("  wav ->", JSON.stringify(r.body));
r = await postAnalyze([ocrFile]);
console.log("  png ->", JSON.stringify(r.body));

console.log("\n2. Conversions");
record("jpg-to-png", await postConvert([jpgFile], "jpg-to-png", "png", { quality: "high", imageQuality: 90 }));
record("png-to-jpg", await postConvert([pngFile], "png-to-jpg", "jpg", { quality: "high" }));
record("images-to-pdf", await postConvert([jpgFile, pngFile], "images-to-pdf", "pdf", { pageSize: "Original" }));
record("pdf-to-jpg (3 pages)", await postConvert([pdfFile], "pdf-to-jpg", "jpg", { dpi: 100 }));
record("pdf-to-text", await postConvert([pdfFile], "pdf-to-text", "txt"));
record("txt-to-pdf", await postConvert([path.join(OUT, "sample.txt")], "txt-to-pdf", "pdf"));
const wavToMp3 = await postConvert([wavFile], "wav-to-mp3", "mp3", { audioBitrate: "128k" });
record("wav-to-mp3", wavToMp3);
if (wavToMp3.result?.outputs?.[0]) {
  fs.writeFileSync(path.join(OUT, "tone-out.mp3"), Buffer.from(wavToMp3.result.outputs[0].data, "base64"));
}
record("mp3-to-wav", await postConvert([path.join(OUT, "tone-out.mp3")], "mp3-to-wav", "wav"));
record("pdf-merge", await postConvert([pdfFile, pdfFile], "pdf-merge", "pdf"));
record("pdf-split", await postConvert([pdfFile], "pdf-split", "pdf"));
record("pdf-compress", await postConvert([pdfFile], "pdf-compress", "pdf"));
record("pdf-rotate", await postConvert([pdfFile], "pdf-rotate", "pdf", { rotateDeg: 90 }));
record("video-to-mp3", await postConvert([mp4File], "video-to-mp3", "mp3"));
record("mp4-to-gif", await postConvert([mp4File], "mp4-to-gif", "gif"));
record("ocr image-to-text", await postConvert([ocrFile], "image-to-text", "txt", { ocrLang: "eng" }));

console.log("\n3. Error handling");
record("empty-target", await postConvert([jpgFile], "jpg-to-png", ""), "unsupported");
record("coming-soon docx-to-pdf", await postConvert([fakeDocx], "docx-to-pdf", "pdf"), "noEngine");
record("pdf-encrypt (coming soon)", await postConvert([pdfFile], "pdf-encrypt", "pdf", { password: "x" }), "noEngine");

console.log("\n=== E2E RESULTS ===");
for (const line of results) console.log(line);
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
