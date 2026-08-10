import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v18" />
          <path d="M5 21l3-6h8l3 6" opacity="0" />
          <path d="M5 8.5L8.5 5 12 8.5 15.5 5 19 8.5" opacity="0" />
          <path d="M8 20h8" />
          <path d="M4 9l4-4m0 0l4 4m-4-4v9" transform="translate(0,0)" />
          <path d="M16 9l4-4m0 0l-4 4m4-4v9" transform="translate(0,0)" />
        </svg>
      </span>
      {!compact && (
        <span className="text-xl font-extrabold tracking-tight text-content">
          Convert<span className="text-primary">X</span>
        </span>
      )}
    </span>
  );
}
