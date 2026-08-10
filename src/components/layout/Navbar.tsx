"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { Button } from "@/components/ui/Button";

export function Navbar({ onUpload }: { onUpload?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: t.nav.convert, active: pathname === "/" },
    { href: "/tools", label: t.nav.allTools },
    { href: "/pdf", label: t.nav.pdf },
    { href: "/tools?category=Images", label: t.nav.images },
    { href: "/tools?category=Documents", label: t.nav.docs },
    { href: "/history", label: t.nav.history },
  ];

  const handleUpload = () => {
    setOpen(false);
    if (onUpload) return onUpload();
    router.push("/#upload");
    setTimeout(() => {
      document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "border-line bg-surface/85 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60">
          <Logo />
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                l.active
                  ? "bg-primary-soft text-primary-dark dark:text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-content"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangToggle className="hidden sm:inline-flex" />
          <Button size="sm" className="hidden sm:inline-flex" icon={<Upload className="size-4" />} onClick={handleUpload}>
            {t.nav.uploadFile}
          </Button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-content lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-line bg-surface lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-[15px] font-medium",
                    l.active
                      ? "bg-primary-soft text-primary-dark dark:text-primary"
                      : "text-content hover:bg-surface-2"
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-line pt-4">
                <Button className="flex-1" icon={<Upload className="size-4" />} onClick={handleUpload}>
                  {t.nav.uploadFile}
                </Button>
                <LangToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
