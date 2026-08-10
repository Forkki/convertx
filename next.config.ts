import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    "sharp",
    "ffmpeg-static",
    "tesseract.js",
    "@napi-rs/canvas",
    "pdfjs-dist",
    "pdf-lib",
    "unpdf",
  ],
};

export default nextConfig;
