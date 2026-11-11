import type { WrittenPost } from "@/lib/content";
import ContentHeader from "./ContentHeader";
import RichHtml from "./RichHtml";

export default function MarkdownArticle({ post }: { post: WrittenPost }) {
  return (
    <article className="content-page">
      <ContentHeader post={post} />
      <RichHtml html={post.html} />
    </article>
  );
}
