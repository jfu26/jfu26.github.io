import Link from "next/link";
import type { ContentSummary } from "@/lib/content";

const labels = {
  markdown: "Research note",
  rmarkdown: "RMarkdown",
  html: "Interactive note",
  notebook: "Jupyter notebook",
};

export default function ContentHeader({ post }: { post: ContentSummary }) {
  return (
    <header className="content-header">
      <Link className="content-back" href="/posts/">← All writing</Link>
      <h1>{post.title}</h1>
      <p className="entry-meta">{post.date} · {labels[post.kind]}{post.tags.length ? ` · ${post.tags.join(", ")}` : ""}</p>
      <p className="content-summary">{post.summary}</p>
    </header>
  );
}
