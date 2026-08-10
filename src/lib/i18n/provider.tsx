"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type Dict, type Lang } from "./dictionaries";

const LANG_KEY = "convertx.lang";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
  fmt: (template: string, vars: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function getInitialLang(): Lang {
  if (typeof window === "undefined") return "th";
  const stored = window.localStorage.getItem(LANG_KEY);
  return stored === "en" ? "en" : "th";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const fmt = useCallback(
    (template: string, vars: Record<string, string | number>) => {
      return template.replace(/\{(\w+)\}/g, (_, key: string) =>
        vars[key] !== undefined ? String(vars[key]) : `{${key}}`
      );
    },
    []
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: dictionaries[lang], fmt }),
    [lang, setLang, fmt]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
