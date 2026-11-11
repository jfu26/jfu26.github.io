import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RichHtml from "@/components/RichHtml";
import { getPages } from "@/lib/notes";

// Markdown notes are pages; LaTeX courses link straight to their PDF and TeX.
export const dynamicParams = false;
export function generateStaticParams() { return getPages().map(({ slug }) => ({ slug })); }
const getPage = (slug: string) => getPages().find((page) => page.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getPage((await params).slug);
  return page ? { title: page.title } : {};
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getPage((await params).slug);
  if (!page) notFound();
  return (
    <article>
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/notes/">Notes</Link></nav>
      <h1 className="page-heading">{page.title}</h1>
      <p className="entry-meta">{page.date}</p>
      <RichHtml html={page.html} />
    </article>
  );
}
