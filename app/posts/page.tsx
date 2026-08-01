import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPosts, getSlides } from "@/lib/content";

export const metadata: Metadata = { title: "Posts", description: "Research notes, Jupyter notebooks, RMarkdown, and slides." };

const kindLabel = { markdown: "Note", rmarkdown: "RMarkdown", notebook: "Notebook" };

export default function PostsPage() {
  const posts = getPosts();
  const slides = getSlides();
  return (
    <main className="site-shell">
      <SiteHeader />
      <header className="page-title"><p className="overline">Writing & computation</p><h1>Posts</h1><p>Mathematical notes, computational notebooks, and presentations. Source files remain plain Markdown, RMarkdown, Jupyter, or reveal.js Markdown.</p></header>
      <section className="collection-section">
        <h2>Notes and notebooks</h2>
        <ul className="entry-list">
          {posts.map((post) => <li key={post.slug}><div><span className="entry-kind">{kindLabel[post.kind]}</span><Link href={`/posts/${post.slug}`}>{post.title}</Link><p>{post.summary}</p><small>{post.tags.join(" · ")}</small></div><time>{post.date}</time></li>)}
        </ul>
      </section>
      <section className="collection-section">
        <h2>Slides</h2>
        <ul className="entry-list">
          {slides.map((slide) => <li key={slide.slug}><div><span className="entry-kind">reveal.js</span><Link href={`/slides/${slide.slug}`}>{slide.title}</Link><p>{slide.summary}</p></div><time>{slide.date}</time></li>)}
        </ul>
      </section>
      <SiteFooter />
    </main>
  );
}
