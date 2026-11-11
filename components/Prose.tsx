"use client";

import { useEffect, useRef } from "react";

const started = new WeakSet<Element>();

// Renders author-owned HTML and runs its <script> tags, which innerHTML leaves inert.
// Scripts run in document order: an external library finishes loading before the
// inline figure code below it runs. MathJaxSync typesets the page afterwards.
export default function Prose({ html, className = "prose" }: { html: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    // React dev mode mounts effects twice; scripts must run once.
    if (!element || started.has(element)) return;
    started.add(element);
    void (async () => {
      for (const inert of Array.from(element.querySelectorAll("script"))) {
        const script = document.createElement("script");
        for (const { name, value } of Array.from(inert.attributes)) script.setAttribute(name, value);
        script.textContent = inert.textContent;
        const loaded = script.src && new Promise((resolve) => { script.onload = script.onerror = resolve; });
        inert.replaceWith(script);
        await loaded;
      }
    })();
  }, [html]);

  return <div className={className} ref={root} dangerouslySetInnerHTML={{ __html: html }} />;
}
