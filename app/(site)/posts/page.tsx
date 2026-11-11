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
      <header className="page-title"><h1>Writing</h1><p>Mathematical notes, interactive notes, computational notebooks, and slides.</p></header>
      <section className="collection-section">
        <h2>Notes and notebooks</h2>
        <ul className="entry-list">
          {posts.map((post) => <li key={post.slug}><div><span className="entry-kind">{kindLabel[post.kind]}</span><Link href={`/posts/${post.slug}/`}>{post.title}</Link><p>{post.summary}</p><small>{post.tags.join(" · ")}</small></div><time>{post.date}</time></li>)}
        </ul>
      </section>
      <section className="collection-section">
        <h2>Slides</h2>
        <ul className="entry-list">
          {slides.map((slide) => <li key={slide.slug}><div><span className="entry-kind">reveal.js</span><Link href={`/slides/${slide.slug}/`}>{slide.title}</Link><p>{slide.summary}</p></div><time>{slide.date}</time></li>)}
        </ul>
      </section>
    </>
  );
}
