import "server-only";

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./content";

/*
 * Notes: content/notes/<slug>/ holds either a LaTeX course (meta.json; its PDF and TeX
 * live at public/notes/<slug>.pdf and .tex) or a Markdown note (index.md) rendered as a
 * page. sections.json declares the shelves of the Notes page.
 */

const ROOT = join(process.cwd(), "content", "notes");

export type NoteCourse = {
  kind: "course";
  slug: string;
  title: string;
  section: string;
  course: string;
  institution: string;
  date: string;
  order: number;
  pdf: string;
  tex: string;
};
export type NotePage = { kind: "page"; slug: string; title: string; section: string; date: string; order: number; html: string };
export type Note = NoteCourse | NotePage;
export type NoteSectionGroup = { id: string; title: string; groups?: { id: string; title: string }[] };

function loadCourse(slug: string): NoteCourse {
  const meta = JSON.parse(readFileSync(join(ROOT, slug, "meta.json"), "utf8"));
  return { kind: "course", slug, ...meta, pdf: `/notes/${slug}.pdf`, tex: `/notes/${slug}.tex` };
}

function loadPage(slug: string): NotePage {
  const { data, content } = matter(readFileSync(join(ROOT, slug, "index.md"), "utf8"));
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "");
  return { kind: "page", slug, title: String(data.title), section: String(data.section), date, order: Number(data.order ?? 0), html: renderMarkdown(content) };
}

let cache: Note[] | undefined;
/** All notes, ordered by `order`, then newest first. */
export function getNotes(): Note[] {
  cache ??= readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => existsSync(join(ROOT, entry.name, "meta.json")) ? loadCourse(entry.name) : loadPage(entry.name))
    .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
  return cache;
}

export const getPages = () => getNotes().filter((note): note is NotePage => note.kind === "page");
export const noteSections: NoteSectionGroup[] = JSON.parse(readFileSync(join(ROOT, "sections.json"), "utf8"));
