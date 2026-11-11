import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NotesToc from "@/components/NotesToc";
import { getCourse, getCourses } from "@/lib/notes";

export const dynamicParams = false;
export function generateStaticParams() { return getCourses().map(({ slug }) => ({ course: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const course = getCourse((await params).course);
  return course ? { title: course.title, description: `${course.course} notes, ${course.institution}.` } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const course = getCourse((await params).course);
  if (!course) notFound();
  return (
    <article className="course-page">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/notes/">Notes</Link></nav>
      <h1 className="page-heading">{course.title}</h1>
      <p className="position">{course.course} · {course.institution} · {course.date.slice(0, 4)}</p>
      <p className="note-links">
        <Link href={`/notes/${course.slug}/${course.chapters[0].slug}/`}>Start reading</Link>
        <a href={course.pdf}>PDF</a>
        <a href={course.source}>LaTeX source</a>
      </p>
      <div className="prose course-abstract" dangerouslySetInnerHTML={{ __html: course.abstract }} />
      <p className="muted course-credit">{course.credit}</p>
      <section className="page-section">
        <h2>Contents</h2>
        <nav className="course-toc" aria-label="Contents"><NotesToc course={course} sections /></nav>
      </section>
    </article>
  );
}
