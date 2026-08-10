import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { TOOLS, toolAvailable } from "@/lib/engine/tools";
import { PdfClient, type SerializedPdfTool } from "@/components/pdf/PdfClient";

export const metadata: Metadata = {
  title: dictionaries.en.meta.pdfTitle,
  description: dictionaries.en.meta.pdfDesc,
};

const PDF_SLUGS = [
  "pdf-to-jpg",
  "pdf-to-png",
  "pdf-to-webp",
  "pdf-to-text",
  "pdf-merge",
  "pdf-split",
  "pdf-extract-pages",
  "pdf-delete-pages",
  "pdf-reorder-pages",
  "pdf-rotate",
  "pdf-compress",
  "jpg-to-pdf",
  "images-to-pdf",
  "pdf-encrypt",
  "pdf-decrypt",
];

const pdfTools: SerializedPdfTool[] = PDF_SLUGS.map((slug) => {
  const tool = TOOLS.find((x) => x.slug === slug);
  if (!tool) return null;
  return {
    slug,
    from: tool.fixed?.from ?? tool.from[0] ?? "pdf",
    to: tool.fixed?.to ?? tool.to[0] ?? "pdf",
    available: toolAvailable(tool),
  };
}).filter((x): x is SerializedPdfTool => x !== null);

export default function PdfPage() {
  return <PdfClient tools={pdfTools} />;
}
