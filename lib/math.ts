import "server-only";
import temml from "temml";

export type Macros = Record<string, string>;

const reported = new Set<string>();

// Big operators whose limits sit under/over the symbol throughout display math, fractions included.
// Inline math keeps TeX's side limits so running text keeps an even line spacing.
const BIG_OPERATORS = "sum|prod|coprod|bigcup|bigcap|bigoplus|bigotimes|bigvee|bigwedge|max|min|sup|inf|lim|limsup|liminf";
const limitsPattern = new WeakMap<Macros, RegExp>();
const NO_MACROS: Macros = {};

/** `\sum_{i=1}^n` → `\sum\limits_{i=1}^n`, also for `\DeclareMathOperator*` macros. */
function limitsBelow(source: string, macros: Macros) {
  let pattern = limitsPattern.get(macros);
  if (!pattern) {
    const starred = Object.keys(macros).filter((name) => macros[name].startsWith("\\operatorname*")).map((name) => name.slice(1));
    pattern = new RegExp(`\\\\(${[BIG_OPERATORS, ...starred].join("|")})(?![a-zA-Z])(?!\\s*\\\\(?:no)?limits)(?=\\s*[_^])`, "g");
    limitsPattern.set(macros, pattern);
  }
  return source.replace(pattern, "\\$1\\limits");
}

// Renders TeX to MathML Core at build time: browsers lay it out natively, so pages ship
// no math JavaScript and stay small (about a seventh of KaTeX's HTML output).
export function renderTex(source: string, display: boolean, macros: Macros = NO_MACROS) {
  try {
    // Temml may mutate the macro table on \gdef; each formula gets its own copy.
    return temml.renderToString(display ? limitsBelow(source, macros) : source, { displayMode: display, wrap: display ? "none" : "tex", throwOnError: true, macros: { ...macros } });
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
