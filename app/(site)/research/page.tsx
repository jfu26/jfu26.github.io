import type { Metadata } from "next";

export const metadata: Metadata = { title: "Research" };

const areas = [
  {
    title: "Macroeconomic theory",
    question: "How do recursive equilibria with heterogeneous agents and incomplete information map primitives into aggregate dynamics?",
    math: String.raw`V(s)=\max_{a\in A(s)}\bigl\{u(s,a)+\beta\,\mathbb E\,[V(s')\mid s,a]\bigr\}`,
  },
  {
    title: "Monetary policy",
    question: "How do policy rules, communication, and the expectations channel govern transmission, and when do these channels weaken?",
    math: String.raw`\pi_t=\beta\,\mathbb E_t\pi_{t+1}+\kappa x_t,\qquad i_t=r^\ast+\phi_\pi\pi_t+\phi_x x_t`,
  },
  {
    title: "Expectations and forecasting",
    question: "How do households, firms, and professional forecasters form beliefs, and what do their forecast errors reveal about information frictions?",
    math: String.raw`x_{t+h}-F_t x_{t+h}=\alpha+\beta_{\text{CG}}\,(F_t x_{t+h}-F_{t-1}x_{t+h})+\varepsilon_{t+h}`,
  },
  {
    title: "Geoeconomics and international macroeconomics",
    question: "How do trade fragmentation, sanctions, and value-chain realignment change the cross-border transmission of shocks and the room for domestic policy?",
    math: String.raw`i_t-i_t^\ast=\mathbb E_t\,\Delta e_{t+1}+\lambda_t`,
  },
];

export default function ResearchPage() {
  return (
    <>
      <header className="page-title">
        <h1>Research</h1>
        <p>My research is in macroeconomics. It asks how expectations, policy, and the geography of trade and finance shape aggregate outcomes. The areas below are the questions currently guiding my work.</p>
      </header>
      <section className="research-list">
        {areas.map((area, index) => (
          <article key={area.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{area.title}</h2>
              <p>{area.question}</p>
              <div className="display-math">{`\\[${area.math}\\]`}</div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
