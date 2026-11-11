"use client";

import { useEffect, useRef } from "react";

// Renders author-owned HTML and runs its <script> tags, which innerHTML leaves inert.
// MathJaxSync typesets afterwards, so TeX written by these scripts is rendered too.
export default function Prose({ html, className = "prose" }: { html: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    for (const inert of element.querySelectorAll<HTMLScriptElement>("script:not([data-ran])")) {
      const script = document.createElement("script");
      for (const { name, value } of inert.attributes) script.setAttribute(name, value);
      script.dataset.ran = "";
      script.textContent = inert.textContent;
      inert.replaceWith(script);
    }
  }, [html]);

  return <div className={className} ref={root} dangerouslySetInnerHTML={{ __html: html }} />;
}
