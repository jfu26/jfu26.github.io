import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NotesToc from "@/components/NotesToc";
import RichHtml from "@/components/RichHtml";
import { getCourse, getCourses } from "@/lib/notes";

type Params = Promise<{ course: string; chapter: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().flatMap((course) => course.chapters.map((chapter) => ({ course: course.slug, chapter: chapter.slug })));
}

async function find(params: Params) {
  const { course: courseSlug, chapter: chapterSlug } = await params;
  const course = getCourse(courseSlug);
  const index = course?.chapters.findIndex((chapter) => chapter.slug === chapterSlug) ?? -1;
  return course && index >= 0 ? { course, index, chapter: course.chapters[index] } : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await find(params);
  return found ? { title: `${found.chapter.number ? `${found.chapter.number}. ` : ""}${found.chapter.plainTitle} · ${found.course.course}` } : {};
}

export default async function ChapterPage({ params }: { params: Params }) {
  const found = await find(params);
  if (!found) notFound();
  const { course, chapter, index } = found;
  const previous = course.chapters[index - 1], next = course.chapters[index + 1];
  const href = (slug: string) => `/notes/${course.slug}/${slug}/`;
  return (
    <div className="notes-layout">
      <nav className="notes-sidebar" aria-label={`${course.course} chapters`}>
        <Link className="notes-sidebar-title" href={`/notes/${course.slug}/`}>{course.title}</Link>
        <NotesToc course={course} current={chapter.slug} />
        <p className="note-links"><a href={course.pdf}>PDF</a><a href={course.source}>LaTeX source</a></p>
      </nav>

      <article className="note-chapter">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/notes/">Notes</Link><Link href={`/notes/${course.slug}/`}>{course.course}</Link>
        </nav>
        <details className="notes-mobile-toc">
          <summary>Contents</summary>
          <NotesToc course={course} current={chapter.slug} />
        </details>
        <header className="chapter-header">
          {chapter.number && chapter.part && <p className="overline" dangerouslySetInnerHTML={{ __html: chapter.part }} />}
          <h1>{chapter.number && <span className="secnum">{chapter.number}</span>}<span dangerouslySetInnerHTML={{ __html: chapter.title }} /></h1>
        </header>
        <RichHtml className="prose notes-prose" html={chapter.html} />
        <nav className="pager" aria-label="Chapters">
          {previous ? <Link rel="prev" href={href(previous.slug)}><span>Previous</span><span dangerouslySetInnerHTML={{ __html: previous.title }} /></Link> : <span />}
          {next && <Link rel="next" href={href(next.slug)}><span>Next</span><span dangerouslySetInnerHTML={{ __html: next.title }} /></Link>}
        </nav>
      </article>
    </div>
  );
}
