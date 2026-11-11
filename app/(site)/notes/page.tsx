import type { Metadata } from "next";
import Link from "next/link";
import { getCourses } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Notes",
  description: "Lecture and study notes in economics and econometrics, readable online chapter by chapter or as PDF.",
};

export default function NotesIndex() {
  const courses = getCourses();
  return (
    <>
      <h1 className="page-heading">Notes</h1>
      <p className="lede">Study notes from graduate coursework, written in LaTeX. Each set reads online chapter by chapter, with numbered results, cross-references, collapsible proofs and interactive figures, and is also available as the typeset PDF.</p>
      <ol className="course-list">
        {courses.map((course) => (
          <li key={course.slug}>
            <p className="entry-meta">{course.course} · {course.institution} · {course.date.slice(0, 4)}</p>
            <h2><Link href={`/notes/${course.slug}/`}>{course.title}</Link></h2>
            <div className="course-abstract" dangerouslySetInnerHTML={{ __html: course.abstract.match(/<p>[\s\S]*?<\/p>/)?.[0] ?? "" }} />
            <p className="note-links">
              <Link href={`/notes/${course.slug}/`}>Read online · {course.chapters.length} chapters</Link>
              <a href={course.pdf}>PDF</a>
              <a href={course.source}>LaTeX source</a>
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
