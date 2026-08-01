import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MacroAtlas from "./MacroAtlas";

export const metadata: Metadata = {
  title: "Global Macro Atlas",
  description: "An interactive country-level view of the complete IMF WEO and Global Macro Database indicator catalogs, with DBnomics access.",
};

export default function MacroPage() {
  return (
    <main className="atlas-page">
      <SiteHeader />
      <section className="atlas-title">
        <p className="overline">Open data</p>
        <h1>Global Macro Atlas</h1>
        <p>
          Select a source, indicator, and year. Click any country to inspect its
          annual history. Source values are shown without interpolation.
        </p>
      </section>
      <MacroAtlas />
      <SiteFooter />
    </main>
  );
}
