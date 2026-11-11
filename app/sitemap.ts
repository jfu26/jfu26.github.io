import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { getCourses } from "@/lib/notes";

export const dynamic = "force-static";
const site = "https://jfu26.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "research/", "notes/", "posts/", "macro/", "cv/"].map((path) => ({ url: `${site}/${path}` }));
  const notes = getCourses().flatMap((course) => [
    { url: `${site}/notes/${course.slug}/`, lastModified: course.date },
    ...course.chapters.map((chapter) => ({ url: `${site}/notes/${course.slug}/${chapter.slug}/`, lastModified: course.date })),
  ]);
  const posts = getPosts().map((post) => ({ url: `${site}/posts/${post.slug}/`, lastModified: post.date }));
  return [...pages, ...notes, ...posts];
}
