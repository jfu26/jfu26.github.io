import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Figure ids used by `<figure data-figure="id">caption</figure>` in Markdown notes.
// Each loads as its own chunk, only on pages that use it;
// the SVG is still rendered at build time, so figures are visible before any JS runs.
export const figures: Record<string, ComponentType> = {
  "taylor-zlb": dynamic(() => import("./TaylorZlb")),
  cobweb: dynamic(() => import("./Cobweb")),
};
