import Link from "next/link";
import type { NoteChapter, NoteCourse } from "@/lib/notes";

/** Chapters grouped by \part; unnumbered front and back matter stands outside any part. */
export function groupByPart(chapters: NoteChapter[]) {
  const groups: { part?: string; chapters: NoteChapter[] }[] = [];
  for (const chapter of chapters) {
    const part = chapter.number ? chapter.part : undefined;
    const last = groups.at(-1);
    if (last && last.part === part) last.chapters.push(chapter);
    else groups.push({ part, chapters: [chapter] });
  }
  return groups;
}

const html = (__html: string) => ({ dangerouslySetInnerHTML: { __html } });

/** Course table of contents; the current chapter expands to its sections. */
export default function NotesToc({ course, current, sections = false }: { course: NoteCourse; current?: string; sections?: boolean }) {
  return (
    <>
      {groupByPart(course.chapters).map((group, index) => (
        <div className="toc-group" key={index}>
          {group.part && <p className="toc-part" {...html(group.part)} />}
          <ol className="toc">
            {group.chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link href={`/notes/${course.slug}/${chapter.slug}/`} aria-current={chapter.slug === current ? "page" : undefined}>
                  {chapter.number && <span className="secnum">{chapter.number}</span>}
                  <span {...html(chapter.title)} />
                </Link>
                {(sections || chapter.slug === current) && chapter.sections.length > 0 && (
                  <ol className="toc-sections">
                    {chapter.sections.map((section) => (
                      <li key={section.id}>
                        <Link href={`/notes/${course.slug}/${chapter.slug}/#${section.id}`}>
                          {section.number && <span className="secnum">{section.number}</span>}
                          <span {...html(section.title)} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}
