import type { Metadata } from "next";
import { getPublications, profile, type Publication } from "@/lib/content";

export const metadata: Metadata = { title: "Research" };

const bibtex = (item: Publication) => [
  `@${item.type}{${item.citekey},`,
  ...Object.entries({ title: item.title, author: item.authors, journal: item.venue, year: item.year, doi: item.doi })
    .filter(([, value]) => value).map(([key, value]) => `  ${key} = {${value}},`),
  "}",
].join("\n");

export default async function ResearchPage() {
  const publications = await getPublications();
  return (
    <>
      <h1 className="page-heading">Research</h1>

      <section className="page-section">
        <h2>Research interests</h2>
        <p>{profile.interests.join(" · ")}</p>
      </section>

      <section className="page-section">
        <h2>Working papers</h2>
        {publications.length ? (
          <ul className="paper-list">
            {publications.map((item) => (
              <li key={item.citekey}>
                <span className="paper-title">{item.url ? <a href={item.url}>{item.title}</a> : item.title}</span>
                {item.authors && <span>{item.authors.replaceAll(" and ", ", ")}</span>}
                <span className="entry-meta"> · {[item.venue, item.year].filter(Boolean).join(", ")}</span>
                <div className="paper-links">
                  {item.abstract && <details><summary>Abstract</summary><p>{item.abstract}</p></details>}
                  {item.pdf && <a href={item.pdf}>PDF</a>}
                  {item.code && <a href={item.code}>Code</a>}
                  {item.doi && <a href={`https://doi.org/${item.doi}`}>DOI</a>}
                  <details><summary>BibTeX</summary><pre>{bibtex(item)}</pre></details>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Papers will be posted here as drafts become available.</p>}
      </section>
    </>
  );
}
