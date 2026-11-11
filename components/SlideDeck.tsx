"use client";

import { useEffect, useRef } from "react";

export default function SlideDeck({ markdown }: { markdown: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    let cancelled = false;
    let deck: { destroy: () => void } | undefined;
    const initialize = async () => {
      const [{ default: Reveal }, { default: Markdown }, { default: Highlight }, { default: Notes }, { default: RevealMath }] = await Promise.all([
        import("reveal.js"),
        import("reveal.js/plugin/markdown"),
        import("reveal.js/plugin/highlight"),
        import("reveal.js/plugin/notes"),
        import("reveal.js/plugin/math"),
      ]);
      if (cancelled || !root.current) return;
      const instance = new Reveal(root.current, {
        embedded: true,
        hash: true,
        transition: "none",
        controls: true,
        progress: true,
        // Slides are rendered client-side by reveal, so math uses its KaTeX plugin (pinned).
        katex: { version: "0.16.22" },
        plugins: [Markdown, Highlight, Notes, RevealMath.KaTeX],
      });
      deck = instance;
      await instance.initialize();
    };
    void initialize();
    return () => { cancelled = true; deck?.destroy(); };
  }, []);

  return (
    <div className="reveal" ref={root}>
      <div className="slides">
        <section data-markdown="" data-separator-notes="^Note:">
          <textarea data-template="" defaultValue={markdown} />
        </section>
      </div>
    </div>
  );
}
