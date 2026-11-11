import type { WrittenPost } from "@/lib/content";
import ContentHeader from "./ContentHeader";
import Prose from "./Prose";

export default function MarkdownArticle({ post }: { post: WrittenPost }) {
  return (
    <article className="content-page">
      <ContentHeader post={post} />
      <Prose html={post.html} />
    </article>
  );
}
