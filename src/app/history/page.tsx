import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { HistoryClient } from "@/components/history/HistoryClient";

export const metadata: Metadata = {
  title: dictionaries.en.meta.historyTitle,
  description: dictionaries.en.meta.historyDesc,
};

export default function HistoryPage() {
  return <HistoryClient />;
}
