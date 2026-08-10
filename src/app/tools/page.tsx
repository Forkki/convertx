import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { TOOLS, toolAvailable, type ToolDef } from "@/lib/engine/tools";
import { getFormat } from "@/lib/engine/formats";
import { ToolsClient } from "@/components/tools/ToolsClient";

export const metadata: Metadata = {
  title: dictionaries.en.meta.toolsTitle,
  description: dictionaries.en.meta.toolsDesc,
};

const DESC_BY_OP: Record<string, string> = {
  image: "image",
  "image-pdf": "toPdf",
  "pdf-image": "pdfOut",
  "pdf-text": "pdfOp",
  "text-pdf": "toPdf",
  "pdf-merge": "pdfOp",
  "pdf-split": "pdfOp",
  "pdf-extract": "pdfOp",
  "pdf-delete": "pdfOp",
  "pdf-reorder": "pdfOp",
  "pdf-rotate": "pdfOp",
  "pdf-compress": "compress",
  "media-extract-audio": "videoToAudio",
  "media-to-gif": "video",
  ocr: "ocr",
  none: "comingSoon",
};

function descKeyFor(tool: ToolDef): string {
  if (tool.slug === "audio-convert") return "audio";
  if (tool.slug === "video-convert" || tool.slug === "video-compress") return "video";
  if (tool.slug === "image-compress") return "compress";
  if (tool.slug === "pdf-to-text") return "ocr";
  if (tool.op === "media") {
    const fromCat = getFormat(tool.fixed?.from ?? tool.from[0] ?? "")?.category;
    if (fromCat === "audio") return "audio";
    if (fromCat === "video") return "video";
    return "generic";
  }
  return DESC_BY_OP[tool.op] ?? "generic";
}

export interface SerializedTool {
  slug: string;
  category: string;
  from: string;
  to: string;
  available: boolean;
  descKey: string;
}

const tools = TOOLS.map((tool) => ({
  slug: tool.slug,
  category: tool.category,
  from: tool.fixed?.from ?? tool.from[0] ?? "",
  to: tool.fixed?.to ?? tool.to[0] ?? "",
  available: toolAvailable(tool),
  descKey: descKeyFor(tool),
}));

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ToolsClient tools={tools} initialCategory={category ?? null} />;
}
