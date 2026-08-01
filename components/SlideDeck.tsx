"use client";

import { useEffect, useRef } from "react";

export default function SlideDeck({ markdown }: { markdown: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    let cancelled = false;
    let deck: { destroy: () => void } | undefined;
    const initialize = async () => {
      const [{ default: Reveal }, { default: Markdown }, { default: Highlight }, { default: Notes }] = await Promise.all([
        import("reveal.js"),
        import("reveal.js/plugin/markdown"),
        import("reveal.js/plugin/highlight"),
        import("reveal.js/plugin/notes"),
      ]);
      if (cancelled || !root.current) return;
      const instance = new Reveal(root.current, {
        embedded: true,
        hash: true,
        transition: "none",
        controls: true,
        progress: true,
        plugins: [Markdown, Highlight, Notes],
      });
      deck = instance;
      await instance.initialize();
      await window.MathJax?.typesetPromise?.([root.current]);
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
