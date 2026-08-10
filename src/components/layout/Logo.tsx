import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.jpg"
        alt="FConvert"
        width={54}
        height={36}
        className="h-9 w-auto shrink-0 rounded-lg object-contain"
      />
      {!compact && (
        <span className="text-xl font-extrabold tracking-tight text-content">
          F<span className="text-primary">Convert</span>
        </span>
      )}
    </span>
  );
}
