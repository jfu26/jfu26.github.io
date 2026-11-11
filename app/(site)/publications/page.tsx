import type { Metadata } from "next";
import Link from "next/link";
import { getPublications } from "@/lib/content";

export const metadata: Metadata = { title: "Publications" };

export default async function PublicationsPage() {
  const publications = await getPublications();
  return (
    <>
      <header className="page-title"><h1>Publications</h1><p>Working papers, publications, and policy reports.</p></header>
      {publications.length ? <ol className="publication-list">{publications.map((item) => <li key={item.slug}><span>{item.year}</span><div><Link href={`/publications/${item.slug}`}>{item.title}</Link><p>{item.authors.replaceAll(" and ", ", ")}</p><small>{item.venue}</small></div></li>)}</ol> : <div className="empty-state"><h2>Work in progress.</h2><p>Working papers will be listed here as they become available.</p></div>}
    </>
  );
}
