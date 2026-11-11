import type { Metadata } from "next";
import Link from "next/link";
import { getPublications, profile } from "@/lib/content";

export const metadata: Metadata = { title: "Research" };

const areas = [
  ["Macroeconomic theory", "Recursive equilibrium, heterogeneous agents, and the mapping from information and market structure to aggregate dynamics."],
  ["Monetary policy", "Policy rules, communication, and the expectations channel of transmission, including environments where it weakens, such as the effective lower bound."],
  ["Expectations and forecasting", "Belief formation by households, firms, and professional forecasters, and what forecast errors reveal about information frictions."],
  ["Geoeconomics and international finance", "Trade fragmentation, sanctions, and value-chain realignment, and how they change the cross-border transmission of shocks and the scope for domestic policy."],
];

export default async function ResearchPage() {
  const publications = await getPublications();
  return (
    <>
      <h1 className="page-heading">Research</h1>

      <section className="page-section">
        <h2>Research interests</h2>
        <dl className="interest-list">
          {areas.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}
        </dl>
      </section>

      <section className="page-section">
        <h2>Working papers</h2>
        {publications.length ? (
          <ul className="paper-list">
            {publications.map((item) => (
              <li key={item.slug}>
                <Link href={`/publications/${item.slug}/`}>{item.title}</Link>
                {item.authors && <span>{item.authors.replaceAll(" and ", ", ")}</span>}
                <span className="entry-meta">{[item.venue, item.year].filter(Boolean).join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Work in progress. Papers will be posted here as drafts become available.</p>}
      </section>

      <section className="page-section">
        <h2>Policy and applied research</h2>
        <ul className="paper-list">
          {profile.policyWork.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.organization}, {item.year}</span>
              <span className="entry-meta">{item.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
