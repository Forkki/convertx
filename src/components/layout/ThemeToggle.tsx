"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content",
        className
      )}
    >
      {mounted ? (
        dark ? <Sun className="size-5" /> : <Moon className="size-5" />
      ) : (
        <span className="size-5" />
      )}
    </button>
  );
}
