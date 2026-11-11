import type { MetadataRoute } from "next";
import { getNotes } from "@/lib/notes";

export const dynamic = "force-static";
const site = "https://jfu26.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "research/", "notes/", "macro/", "cv/"].map((path) => ({ url: `${site}/${path}` }));
  const notes = getNotes().flatMap((note) => [
    { url: `${site}/notes/${note.slug}/`, lastModified: note.date },
    ...(note.kind === "course" ? note.chapters.map((chapter) => ({ url: `${site}/notes/${note.slug}/${chapter.slug}/`, lastModified: note.date })) : []),
  ]);
  return [...pages, ...notes];
}
