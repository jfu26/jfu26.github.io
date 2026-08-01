import type { WrittenPost } from "@/lib/content";
import ContentHeader from "./ContentHeader";

export default function MarkdownArticle({ post }: { post: WrittenPost }) {
  return (
    <article className="content-page">
      <ContentHeader post={post} />
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
