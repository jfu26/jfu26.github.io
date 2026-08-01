import type { NotebookOutput, NotebookPost } from "@/lib/content";
import { asText, renderMarkdown } from "@/lib/content";
import ContentHeader from "./ContentHeader";

function Output({ output }: { output: NotebookOutput }) {
  if (output.data?.["text/html"]) {
    return <div className="notebook-output rich-output" dangerouslySetInnerHTML={{ __html: asText(output.data["text/html"]) }} />;
  }
  if (output.data?.["image/png"]) {
    return (
      // Notebook images are embedded source outputs with no stable external dimensions.
      // eslint-disable-next-line @next/next/no-img-element
      <img className="notebook-image" src={`data:image/png;base64,${asText(output.data["image/png"])}`} alt="Notebook output" />
    );
  }
  const text = output.text || output.data?.["text/plain"];
  return text ? <pre className="notebook-output"><code>{asText(text)}</code></pre> : null;
}

export default function NotebookArticle({ post }: { post: NotebookPost }) {
  return (
    <article className="content-page notebook-page">
      <ContentHeader post={post} />
      <div className="notebook-cells">
        {post.cells.map((cell, index) => cell.cell_type === "markdown" ? (
          <div className="prose notebook-markdown" key={index} dangerouslySetInnerHTML={{ __html: renderMarkdown(asText(cell.source)) }} />
        ) : (
          <section className="notebook-code" key={index}>
            <div className="cell-label">In [{cell.execution_count ?? " "}]</div>
            <pre><code>{asText(cell.source)}</code></pre>
            {cell.outputs?.map((output, outputIndex) => <Output output={output} key={outputIndex} />)}
          </section>
        ))}
      </div>
    </article>
  );
}
