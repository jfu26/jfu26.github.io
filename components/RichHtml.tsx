import { Fragment } from "react";
import { figures } from "./figures";
import "./figures/figures.css";

const FIGURE = /<figure data-figure="([\w-]+)"(?: id="([^"]*)")?>([\s\S]*?)<\/figure>/g;

/**
 * Renders build-time HTML, swapping `<figure data-figure="id">caption</figure>` placeholders
 * for registered interactive figures. Everything else is static HTML with no client cost.
 */
export default function RichHtml({ html, className = "prose" }: { html: string; className?: string }) {
  const parts = html.split(FIGURE);
  const chunk = (source: string, key: number) => source.trim() && <div key={key} className="html-chunk" dangerouslySetInnerHTML={{ __html: source }} />;
  const out = [chunk(parts[0], 0)];
  for (let i = 1; i < parts.length; i += 4) {
    const [id, anchor, caption, after] = parts.slice(i, i + 4);
    const Figure = figures[id];
    if (!Figure) throw new Error(`Unknown figure "${id}". Register it in components/figures/index.ts.`);
    out.push(
      <Fragment key={i}>
        <figure className="interactive" id={anchor || undefined}>
          <Figure />
          <figcaption dangerouslySetInnerHTML={{ __html: caption }} />
        </figure>
        {chunk(after, i + 1)}
      </Fragment>,
    );
  }
  return <div className={className}>{out}</div>;
}
