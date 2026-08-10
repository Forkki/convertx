import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LegalClient } from "@/components/legal/LegalClient";

export const metadata: Metadata = {
  title: dictionaries.en.meta.termsTitle,
  description: dictionaries.en.meta.termsDesc,
};

export default function TermsPage() {
  return <LegalClient kind="terms" />;
}
