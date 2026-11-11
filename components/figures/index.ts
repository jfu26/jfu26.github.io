import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Figure ids used by `<figure data-figure="id">caption</figure>` in posts and by
// content/notes/<course>/meta.json. Each loads as its own chunk, only on pages that use it;
// the SVG is still rendered at build time, so figures are visible before any JS runs.
export const figures: Record<string, ComponentType> = {
  "power-one-sided": dynamic(() => import("./PowerOneSided")),
  "power-local": dynamic(() => import("./PowerLocal")),
  "likelihood-trinity": dynamic(() => import("./LikelihoodTrinity")),
  "iv-dag": dynamic(() => import("./IvDag")),
  "taylor-zlb": dynamic(() => import("./TaylorZlb")),
  cobweb: dynamic(() => import("./Cobweb")),
};
