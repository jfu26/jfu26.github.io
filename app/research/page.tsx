import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <header className="page-title">
        <p className="overline">Research</p>
        <h1>Questions before answers.</h1>
        <p>My research agenda is in development. These fields describe the questions and methods currently guiding it.</p>
      </header>
      <section className="research-list">
        <article><span>01</span><div><h2>Expectations and aggregate dynamics</h2><p>How do beliefs, information, and ambiguity propagate through macroeconomic states?</p><div className="display-math">{String.raw`\[x_t=T\!\left(\mathbb E_t[x_{t+1}]\right)\]`}</div></div></article>
        <article><span>02</span><div><h2>Institutions and policy</h2><p>When do rules discipline policy, and when do institutional constraints bind?</p><div className="display-math">{String.raw`\[V(s)=\max_a\{u(s,a)+\beta\mathbb EV(s')\}\]`}</div></div></article>
        <article><span>03</span><div><h2>International macroeconomics</h2><p>Which shocks travel across borders, through which balance sheets, and with what local amplification?</p><div className="display-math">{String.raw`\[Y=C+I+G+NX\]`}</div></div></article>
      </section>
      <SiteFooter />
    </main>
  );
}
