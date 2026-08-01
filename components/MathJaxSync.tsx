"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    MathJax?: {
      startup?: { promise?: Promise<unknown> };
      typesetClear?: () => void;
      typesetPromise?: (elements?: HTMLElement[]) => Promise<unknown>;
    };
  }
}

export default function MathJaxSync() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const typeset = async () => {
      const mathJax = window.MathJax;
      if (!mathJax?.typesetPromise) return;
      await mathJax.startup?.promise;
      if (cancelled) return;
      mathJax.typesetClear?.();
      await mathJax.typesetPromise();
    };
    const timer = window.setTimeout(typeset, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [pathname]);

  return null;
}
