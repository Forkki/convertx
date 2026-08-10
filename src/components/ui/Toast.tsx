"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  desc?: string;
}

const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" />,
  error: <XCircle className="size-5 text-danger" />,
  info: <Info className="size-5 text-primary" />,
  warning: <AlertTriangle className="size-5 text-warning" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-md"
              role="status"
            >
              <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.desc}</p>}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className={cn("shrink-0 rounded-md p-0.5 text-faint hover:text-content")}
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
