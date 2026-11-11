import "server-only";
import temml from "temml";

const reported = new Set<string>();

// Big operators set their limits under/over the symbol in display math; inline math keeps
// TeX's side limits so running text keeps an even line spacing.
const BIG_OPERATORS = /\\(sum|prod|coprod|bigcup|bigcap|bigoplus|bigotimes|bigvee|bigwedge|max|min|sup|inf|lim|limsup|liminf)(?![a-zA-Z])(?!\s*\\(?:no)?limits)(?=\s*[_^])/g;

// Renders TeX to MathML Core at build time: browsers lay it out natively, so pages ship
// no math JavaScript.
function renderTex(source: string, display: boolean) {
  try {
    return temml.renderToString(display ? source.replace(BIG_OPERATORS, "\\$1\\limits") : source, { displayMode: display, wrap: display ? "none" : "tex", throwOnError: true });
  } catch (error) {
    const message = `${(error as Error).message} in: ${source.slice(0, 80)}`;
    if (!reported.has(message)) console.warn(`[math] ${message}`);
    reported.add(message);
    return `<code class="tex-error">${source.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code>`;
  }
}

// Renders a delimited formula ($…$, $$…$$, \(…\), \[…\]).
export function renderDelimited(formula: string) {
  const display = formula.startsWith("$$") || formula.startsWith("\\[");
  const body = formula.startsWith("$$") ? formula.slice(2, -2) : formula.startsWith("$") ? formula.slice(1, -1) : formula.slice(2, -2);
  return renderTex(body, display);
}
