import type { Metadata } from "next";
import MacroAtlas from "./MacroAtlas";
import "./atlas.css";

export const metadata: Metadata = {
  title: "Global Macro Atlas",
  description: "An interactive country-level view of the complete IMF WEO and Global Macro Database indicator catalogs, with DBnomics access.",
};

export default function MacroPage() {
  return (
    <div className="atlas-page">
      <section className="atlas-title">
        <p className="overline">Open data</p>
        <h1>Global Macro Atlas</h1>
        <p>
          Select a source, indicator, and year. Click any country to inspect its
          annual history. Source values are shown without interpolation.
        </p>
      </section>
      <MacroAtlas />
    </div>
  );
}
