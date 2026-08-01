import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPublication, getPublications } from "@/lib/content";

export const dynamicParams = false;
export async function generateStaticParams() {
  const params = (await getPublications()).map(({ slug }) => ({ slug }));
  // Next static export requires at least one concrete parameterized path.
  return params.length ? params : [{ slug: "catalog" }];
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = await getPublication((await params).slug);
  return item ? { title: item.title, description: item.abstract || item.venue } : {};
}

export default async function PublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const item = await getPublication(slug);
  if (!item && slug === "catalog") {
    return <main className="site-shell"><SiteHeader /><div className="empty-state publication-page"><h1>Publications forthcoming.</h1><p>This reserved static path keeps the BibTeX and DOI publication pipeline ready before the first record is added.</p></div><SiteFooter /></main>;
  }
  if (!item) notFound();
  return (
    <main className="site-shell"><SiteHeader /><article className="publication-page"><p className="overline">{item.type} · {item.year}</p><h1>{item.title}</h1><p className="publication-authors">{item.authors.replaceAll(" and ", ", ")}</p><p>{item.venue}</p>{item.abstract && <section><h2>Abstract</h2><p>{item.abstract}</p></section>}<nav>{item.doi && <a href={`https://doi.org/${item.doi}`}>DOI ↗</a>}{item.pdf && <a href={item.pdf}>PDF ↗</a>}{item.code && <a href={item.code}>Code ↗</a>}{item.url && <a href={item.url}>Publisher ↗</a>}</nav><pre className="citation-block"><code>{`@${item.type}{${item.citekey},\n  title = {${item.title}},\n  author = {${item.authors}},\n  year = {${item.year}}${item.doi ? `,\n  doi = {${item.doi}}` : ""}\n}`}</code></pre></article><SiteFooter /></main>
  );
}
