import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPublications } from "@/lib/content";

export const metadata: Metadata = { title: "Publications" };

export default async function PublicationsPage() {
  const publications = await getPublications();
  return (
    <main className="site-shell">
      <SiteHeader />
      <header className="page-title"><p className="overline">Research output</p><h1>Publications</h1><p>Generated automatically from <code>content/publications.bib</code> and <code>content/dois.txt</code>.</p></header>
      {publications.length ? <ol className="publication-list">{publications.map((item) => <li key={item.slug}><span>{item.year}</span><div><Link href={`/publications/${item.slug}`}>{item.title}</Link><p>{item.authors.replaceAll(" and ", ", ")}</p><small>{item.venue}</small></div></li>)}</ol> : <div className="empty-state"><h2>Publications forthcoming.</h2><p>Add a BibTeX entry or DOI; the index and citation page will be generated during the next build.</p></div>}
      <SiteFooter />
    </main>
  );
}
