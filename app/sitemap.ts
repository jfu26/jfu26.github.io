import type { MetadataRoute } from "next";
import { getPages } from "@/lib/notes";

export const dynamic = "force-static";
const site = "https://jfu26.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "research/", "notes/", "macro/", "cv/"].map((path) => ({ url: `${site}/${path}` }));
  const notes = getPages().map((page) => ({ url: `${site}/notes/${page.slug}/`, lastModified: page.date }));
  return [...pages, ...notes];
}
