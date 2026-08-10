import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://convertx.app"),
  title: {
    default: "ConvertX — Convert every file in one place",
    template: "%s — ConvertX",
  },
  description:
    "Convert every file: images, PDFs, documents, audio and video. High quality, real conversions, private by design.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
  openGraph: {
    title: "ConvertX — Convert every file in one place",
    description:
      "Convert images, PDFs, documents, audio and video at high quality. Free, private, real conversions.",
    type: "website",
    siteName: "ConvertX",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvertX — Convert every file in one place",
    description: "Real, high-quality file conversions in seconds. Private by design.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F8FA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={noto.variable}>
      <body className="min-h-screen bg-bg text-content antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <ToastProvider>
              <div className="flex min-h-screen flex-col overflow-x-clip">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
