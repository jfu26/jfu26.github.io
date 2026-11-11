import "server-only";
import temml from "temml";

export type Macros = Record<string, string>;

const reported = new Set<string>();

// Renders TeX to MathML Core at build time: browsers lay it out natively, so pages ship
// no math JavaScript and stay small (about a seventh of KaTeX's HTML output).
export function renderTex(source: string, display: boolean, macros: Macros = {}) {
  try {
    // Temml may mutate the macro table on \gdef; each formula gets its own copy.
    return temml.renderToString(source, { displayMode: display, wrap: display ? "none" : "tex", throwOnError: true, macros: { ...macros } });
  } catch (error) {
    const message = `${(error as Error).message} in: ${source.slice(0, 80)}`;
    if (!reported.has(message)) console.warn(`[math] ${message}`);
    reported.add(message);
    return `<code class="tex-error">${source.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code>`;
  }
}

// Splits a TeX delimiter match ($…$, $$…$$, \(…\), \[…\]) into its body and display mode.
export function renderDelimited(formula: string, macros?: Macros) {
  const display = formula.startsWith("$$") || formula.startsWith("\\[");
  const body = formula.startsWith("$$") ? formula.slice(2, -2) : formula.startsWith("$") ? formula.slice(1, -1) : formula.slice(2, -2);
  return renderTex(body, display, macros);
}
