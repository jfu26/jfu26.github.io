import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, getSlides } from "@/lib/content";

export const metadata: Metadata = { title: "Writing", description: "Research notes, Jupyter notebooks, RMarkdown, and slides." };

const kindLabel = { markdown: "Note", rmarkdown: "RMarkdown", html: "Interactive", notebook: "Notebook" };

export default function PostsPage() {
  const posts = getPosts();
  const slides = getSlides();
  return (
    <>
      <h1 className="page-heading">Writing</h1>
      <p className="muted">Research notes, interactive notes, computational notebooks, and slides.</p>
      <section className="page-section">
        <h2>Notes and notebooks</h2>
        <ul className="entry-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}/`}>{post.title}</Link>
              <span className="entry-meta">{post.date} · {kindLabel[post.kind]}{post.tags.length ? ` · ${post.tags.join(", ")}` : ""}</span>
              <p>{post.summary}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="page-section">
        <h2>Slides</h2>
        <ul className="entry-list">
          {slides.map((slide) => (
            <li key={slide.slug}>
              <Link href={`/slides/${slide.slug}/`}>{slide.title}</Link>
              <span className="entry-meta">{slide.date} · reveal.js</span>
              <p>{slide.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
