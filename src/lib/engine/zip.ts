import JSZip from "jszip";
import { sanitizeFilename } from "@/lib/utils";
import type { OutputFileData } from "./types";

export async function zipOutputs(outputs: OutputFileData[], baseName = "convertx"): Promise<OutputFileData> {
  const zip = new JSZip();
  const used = new Set<string>();
  for (const o of outputs) {
    let name = sanitizeFilename(o.name);
    let i = 1;
    while (used.has(name)) {
      const dot = name.lastIndexOf(".");
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      name = `${stem}-${i}${ext}`;
      i++;
    }
    used.add(name);
    zip.file(name, o.buffer);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
  return {
    name: `${sanitizeFilename(baseName)}.zip`,
    mime: "application/zip",
    buffer: Buffer.from(buffer),
  };
}
