import type { Metadata } from "next";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { HomeClient } from "@/components/home/HomeClient";
import { MarketingSections } from "@/components/home/sections";

export const metadata: Metadata = {
  title: dictionaries.en.meta.homeTitle,
  description: dictionaries.en.meta.homeDesc,
};

export default function HomePage() {
  return (
    <main>
      <HomeClient />
      <MarketingSections />
    </main>
  );
}
