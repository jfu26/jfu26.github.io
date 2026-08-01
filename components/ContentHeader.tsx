import Link from "next/link";
import type { ContentSummary } from "@/lib/content";

const labels = {
  markdown: "Research note",
  rmarkdown: "RMarkdown",
  notebook: "Jupyter notebook",
};

export default function ContentHeader({ post }: { post: ContentSummary }) {
  return (
    <header className="content-header">
      <Link className="content-back" href="/posts">← All posts</Link>
      <p className="overline">{labels[post.kind]} · {post.date}</p>
      <h1>{post.title}</h1>
      <p className="content-summary">{post.summary}</p>
      <ul className="tag-list" aria-label="Topics">
        {post.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
    </header>
  );
}
