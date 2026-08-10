import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LegalClient } from "@/components/legal/LegalClient";

export const metadata: Metadata = {
  title: dictionaries.en.meta.privacyTitle,
  description: dictionaries.en.meta.privacyDesc,
};

export default function PrivacyPage() {
  return <LegalClient kind="privacy" />;
}
