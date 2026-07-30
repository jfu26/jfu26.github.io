import type { Metadata } from "next";
import Link from "next/link";
import MacroAtlas from "./MacroAtlas";

export const metadata: Metadata = {
  title: "Global Macro Atlas",
  description:
    "An interactive view of global growth, inflation, and public debt from open macroeconomic data.",
};

export default function MacroPage() {
  return (
    <main className="atlas-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Return home">
          JF<span>.</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Profile</Link>
          <Link href="/#research">Research</Link>
          <Link href="/macro">Macro Atlas</Link>
        </nav>
        <span className="header-place">Open macro data</span>
      </header>
      <div className="atlas-head">
        <h1>
          Global Macro Atlas
          <span>One world · many equilibria · daily source refresh</span>
        </h1>
        <div className="live-mark"><i /> On-demand data</div>
      </div>
      <MacroAtlas />
    </main>
  );
}
