import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NotesToc from "@/components/NotesToc";
import RichHtml from "@/components/RichHtml";
import { getNote, getNotes } from "@/lib/notes";

export const dynamicParams = false;
export function generateStaticParams() { return getNotes().map(({ slug }) => ({ course: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const note = getNote((await params).course);
  return note ? { title: note.title } : {};
}

// A LaTeX course shows its contents; a Markdown note is the page itself.
export default async function NotePage({ params }: { params: Promise<{ course: string }> }) {
  const note = getNote((await params).course);
  if (!note) notFound();
  return (
    <article className="course-page">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/notes/">Notes</Link></nav>
      <h1 className="page-heading">{note.title}</h1>
      {note.kind === "page" ? (
        <>
          <p className="entry-meta">{note.date}</p>
          <RichHtml html={note.html} />
        </>
      ) : (
        <>
          <p className="position">{note.course} · {note.institution} · {note.date.slice(0, 4)}</p>
          <p className="note-links">
            <Link href={`/notes/${note.slug}/${note.chapters[0].slug}/`}>Start reading</Link>
            <a href={note.pdf}>PDF</a>
            <a href={note.source}>LaTeX source</a>
          </p>
          <nav className="course-toc page-section" aria-label="Contents"><NotesToc course={note} sections /></nav>
          <p className="muted course-credit">{note.credit}</p>
        </>
      )}
    </article>
  );
}
