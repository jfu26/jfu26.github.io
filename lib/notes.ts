import "server-only";

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { renderMarkdown, slugify } from "./content";
import { renderTex, type Macros } from "./math";

/*
 * Notes: content/notes/<slug>/ holds either a LaTeX course (notes.tex + meta.json,
 * one page per \section) or a single Markdown note (index.md). sections.json orders them.
 *
 * The LaTeX converter handles the LaTeX subset used in content/notes/<course>/notes.tex (article class,
 * amsthm/thmtools theorems, a `whybox` tcolorbox, lists, booktabs tables, figures)
 * at build time. Each \section becomes one page. Numbering follows LaTeX:
 * sections, theorem-like environments within sections, equations continuously.
 * Math is rendered to MathML (Temml) with the document's own \newcommand macros.
 * Figures are replaced by interactive components named in meta.json; any other
 * TikZ picture points readers to the PDF.
 */

const ROOT = join(process.cwd(), "content", "notes");

export type NoteSection = { id: string; number: string | null; title: string };
export type NoteChapter = {
  slug: string;
  number: string | null;
  title: string;
  plainTitle: string;
  part?: string;
  html: string;
  sections: NoteSection[];
};
export type NoteCourse = {
  kind: "course";
  slug: string;
  title: string;
  section: string;
  course: string;
  institution: string;
  credit: string;
  date: string;
  order: number;
  pdf: string;
  source: string;
  chapters: NoteChapter[];
};
export type NotePage = { kind: "page"; slug: string; title: string; section: string; date: string; order: number; html: string };
export type Note = NoteCourse | NotePage;
export type NoteSectionGroup = { id: string; title: string; groups?: { id: string; title: string }[] };

type Meta = Omit<NoteCourse, "kind" | "slug" | "pdf" | "source" | "chapters"> & { figures?: Record<string, string> };
type Label = { number: string; chapter: string; id: string; kind: "section" | "eq" | "other" };

const THEOREMS: Record<string, string> = {
  theorem: "Theorem", proposition: "Proposition", lemma: "Lemma", corollary: "Corollary",
  definition: "Definition", example: "Example", remark: "Remark",
};
const NUMBERED_MATH = /^(equation|align|gather|multline)$/;
const MARK = "\u0005"; // number markers inserted by the numbering pass
const MATH = "\u0001"; // math placeholders
const BLOCK = "\u0004"; // block placeholders

// ---------------------------------------------------------------- utilities

/** Index just past the group that opens at `open` (`{` or `[`), honouring nesting and escapes. */
function groupEnd(text: string, open: number) {
  const [left, right] = text[open] === "[" ? ["[", "]"] : ["{", "}"];
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "\\") { i += 1; continue; }
    if (text[i] === "{" && left === "[") { i = groupEnd(text, i) - 1; continue; }
    if (text[i] === left) depth += 1;
    if (text[i] === right && (depth -= 1) === 0) return i + 1;
  }
  throw new Error(`Unbalanced group at ${text.slice(open, open + 60)}`);
}

/** Reads `{…}` (or `[…]` when optional) at `at`, skipping spaces; returns [content, end]. */
function readGroup(text: string, at: number, optional = false): [string | undefined, number] {
  let i = at;
  while (text[i] === " " || text[i] === "\n") i += 1;
  if (text[i] !== (optional ? "[" : "{")) return [undefined, at];
  const end = groupEnd(text, i);
  return [text.slice(i + 1, end - 1), end];
}

/** Puts a run-in head at the start of the first paragraph (and a tail at the end of the last), as LaTeX does. */
function runIn(head: string, html: string, tail = "") {
  const body = html.startsWith("<p>") ? `<p>${head}${html.slice(3)}` : `<p>${head}</p>${html}`;
  if (!tail) return body;
  return body.endsWith("</p>") ? `${body.slice(0, -4)}${tail}</p>` : `${body}<p>${tail}</p>`;
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Splits at top-level occurrences of `separator`, ignoring those inside groups or nested environments. */
function splitTopLevel(text: string, separator: RegExp) {
  const parts: string[] = [];
  const delimiters: string[] = [];
  let depth = 0;
  let start = 0;
  const pattern = new RegExp(`\\\\begin\\{|\\\\end\\{|\\\\[{}]|[{}]|${separator.source}`, "g");
  for (let match; (match = pattern.exec(text));) {
    const token = match[0];
    if (token === "\\begin{" || token === "{") depth += 1;
    else if (token === "\\end{" || token === "}") depth -= 1;
    else if (token === "\\{" || token === "\\}") continue;
    else if (depth === 0) {
      parts.push(text.slice(start, match.index));
      delimiters.push(token);
      start = match.index + token.length;
    }
  }
  parts.push(text.slice(start));
  return { parts, delimiters };
}

// ---------------------------------------------------------------- macros

function parseMacros(preamble: string): Macros {
  const macros: Macros = {};
  const pattern = /\\(?:re)?newcommand\*?\{?\\(\w+)\}?(?:\[(\d)\])?|\\DeclareMathOperator(\*?)\{\\(\w+)\}/g;
  for (let match; (match = pattern.exec(preamble));) {
    const [body, end] = readGroup(preamble, pattern.lastIndex);
    if (body === undefined) continue;
    pattern.lastIndex = end;
    if (match[1]) macros[`\\${match[1]}`] = body;
    else macros[`\\${match[4]}`] = `\\operatorname${match[3]}{${body}}`;
  }
  return macros;
}

// ---------------------------------------------------------------- the converter

class Converter {
  private formulas: string[] = [];
  private formulaLabels = new Map<number, string[]>();
  private blocks: string[] = [];
  readonly labels = new Map<string, Label>();
  private chapter = "";
  readonly warnings = new Set<string>();

  private course: string;
  private macros: Macros;
  private meta: Meta;
  private pdf: string;

  constructor(course: string, macros: Macros, meta: Meta, pdf: string) {
    this.course = course;
    this.macros = macros;
    this.meta = meta;
    this.pdf = pdf;
  }

  // ---- math: extracted first, in document order, so equation numbers follow LaTeX.
  extractMath(text: string) {
    let equation = 0;
    const pattern = /\\begin\{(equation|align|gather|multline)(\*?)\}([\s\S]*?)\\end\{\1\2\}|(?<!\\)\\\[([\s\S]*?)\\\]|(?<!\\)\\\(([\s\S]*?)\\\)|(?<!\\)\$((?:\\.|[^$\\])+?)\$/g;
    return text.replace(pattern, (_, env, star, envBody, display, inline, dollar) => {
      const index = this.formulas.length;
      const labels: string[] = [];
      const strip = (source: string) => source
        .replace(/\\label\{([^}]+)\}/g, (__, label) => { labels.push(label); return ""; })
        .replace(/\\qedhere/g, "")
        .replace(/\\(eq)?ref\{([^}]+)\}/g, (__, eq, label) => `\\text{${eq ? "(" : ""}⟦${label}⟧${eq ? ")" : ""}}`);
      let html: string;
      if (env) {
        let body = strip(envBody);
        const numbered = !star && NUMBERED_MATH.test(env);
        if (numbered && env === "equation") {
          body = `${body}\\tag{${(equation += 1)}}`;
        } else if (numbered) {
          // One number per row unless the row says \notag / \nonumber.
          const rows = splitTopLevel(envBody, /\\\\/).parts.map((row) => {
            const rowLabels: string[] = [];
            const clean = row.replace(/\\label\{([^}]+)\}/g, (__, label) => { rowLabels.push(label); return ""; });
            if (/\\(notag|nonumber)\b/.test(clean) || !clean.trim()) return clean;
            equation += 1;
            for (const label of rowLabels) labels.push(`${label}${MARK}${equation}`);
            return `${clean}\\tag{${equation}}`;
          });
          body = rows.join("\\\\");
        }
        const name = env === "equation" ? "" : `${env}*`;
        html = renderTex(name ? `\\begin{${name}}${body}\\end{${name}}` : body, true, this.macros);
        // Labels on a plain equation take the equation's number.
        for (let i = 0; i < labels.length; i += 1) if (!labels[i].includes(MARK)) labels[i] = `${labels[i]}${MARK}${equation}`;
      } else if (display !== undefined) {
        html = renderTex(strip(display), true, this.macros);
      } else {
        html = renderTex(strip(inline ?? dollar), false, this.macros);
      }
      const isDisplay = env || display !== undefined;
      if (isDisplay) {
        const ids = labels.map((entry) => slugify(entry.split(MARK)[0]));
        // The <br> ends the preceding text line, so justification leaves it ragged as in TeX.
        html = `<br class="eq"><span class="equation"${ids[0] ? ` id="${ids[0]}"` : ""}>${ids.slice(1).map((id) => `<span id="${id}"></span>`).join("")}${html}</span>`;
      }
      this.formulas.push(html);
      if (labels.length) this.formulaLabels.set(index, labels);
      return `${MATH}${index}${MATH}`;
    });
  }

  // ---- numbering pass: inserts number markers and records every \label.
  number(chapterSlug: string, section: string | null, text: string) {
    let theorem = 0, assumption = 0, subsection = 0;
    let current: { number: string; id: string } = { number: section ?? "", id: "" };
    const pattern = /\\subsection(\*?)\{|\\paragraph\{|\\begin\{(\w+)\}|\\label\{([^}]+)\}|\u0001(\d+)\u0001/g;
    return text.replace(pattern, (token, star, env, label, formula) => {
      if (formula) {
        for (const entry of this.formulaLabels.get(Number(formula)) ?? []) {
          const [name, value] = entry.split(MARK);
          this.labels.set(name, { number: value, chapter: chapterSlug, id: slugify(name), kind: "eq" });
        }
        return token;
      }
      if (label) {
        this.labels.set(label, { number: current.number, chapter: chapterSlug, id: slugify(label), kind: "other" });
        return token;
      }
      if (token.startsWith("\\subsection")) {
        const number = star || section === null ? null : `${section}.${(subsection += 1)}`;
        current = { number: number ?? current.number, id: "" };
        return `\\subsection${star}${MARK}${number ?? ""}${MARK}{`;
      }
      if (token.startsWith("\\paragraph")) return token;
      let number: string | null = null;
      if (env in THEOREMS) number = `${section ?? 0}.${(theorem += 1)}`;
      else if (env === "assumption") number = `${section ?? 0}.${(assumption += 1)}`;
      else if (env === "table" || env === "figure") number = String((this.floats[env as "table" | "figure"] += 1));
      if (number === null) return token;
      current = { number, id: "" };
      return `${token}${MARK}${number}${MARK}`;
    });
  }
  private floats = { table: 0, figure: 0 };

  // ---- render pass
  render(chapterSlug: string, text: string) {
    this.chapter = chapterSlug;
    const sections: NoteSection[] = [];
    const html = this.blocksToHtml(text, sections);
    return { html, sections };
  }

  private blocksToHtml(text: string, sections?: NoteSection[]): string {
    let source = text;
    // Headings become blocks; run-in paragraph titles stay inline.
    source = source.replace(/\\subsection\*?\u0005([^\u0005]*)\u0005\{/g, "\\subsectionN{$1}{");
    source = this.replaceCommand(source, "subsectionN", 2, ([number, title], after) => {
      const [label, end] = this.followingLabel(after);
      const id = label ? slugify(label) : `s${number || slugify(title)}`;
      const titleHtml = this.inline(title);
      sections?.push({ id, number: number || null, title: titleHtml });
      return [`\n\n${this.block(`<h2 id="${id}">${number ? `<span class="secnum">${number}</span> ` : ""}${titleHtml}</h2>`)}\n\n`, end];
    });
    source = this.replaceCommand(source, "paragraph", 1, ([title], after) => {
      const [label, end] = this.followingLabel(after);
      return [`\\runin{${label ? slugify(label) : ""}}{${title}}`, end];
    });

    // Environments, outermost first.
    let out = "";
    let cursor = 0;
    const begin = /\\begin\{(\w+\*?)\}/g;
    for (let match; (match = begin.exec(source));) {
      const end = this.environmentEnd(source, match.index, match[1]);
      out += source.slice(cursor, match.index);
      out += `\n\n${this.block(this.environment(match[1], source.slice(match.index + match[0].length, end.bodyEnd)))}\n\n`;
      cursor = end.end;
      begin.lastIndex = end.end;
    }
    out += source.slice(cursor);

    return out
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        if (/^\u0004\d+\u0004$/.test(chunk)) return this.blocks[Number(chunk.slice(1, -1))];
        const html = this.inline(chunk).trim();
        return html ? `<p>${html}</p>` : "";
      })
      .join("\n");
  }

  private block(html: string) {
    this.blocks.push(html);
    return `${BLOCK}${this.blocks.length - 1}${BLOCK}`;
  }

  private followingLabel(at: string): [string | undefined, number] {
    const match = at.match(/^\s*\\label\{([^}]+)\}/);
    return match ? [match[1], match[0].length] : [undefined, 0];
  }

  /** Replaces `\name{a}{b}…` by fn(args, rest) → [html, consumedFromRest]. */
  private replaceCommand(text: string, name: string, arity: number, fn: (args: string[], rest: string) => [string, number]) {
    const pattern = new RegExp(`\\\\${name}(?![a-zA-Z])`, "g");
    let out = "";
    let cursor = 0;
    for (let match; (match = pattern.exec(text));) {
      let at = match.index + match[0].length;
      const args: string[] = [];
      for (let i = 0; i < arity; i += 1) {
        const [arg, end] = readGroup(text, at);
        args.push(arg ?? "");
        at = end;
      }
      const [html, consumed] = fn(args, text.slice(at));
      out += text.slice(cursor, match.index) + html;
      cursor = at + consumed;
      pattern.lastIndex = cursor;
    }
    return out + text.slice(cursor);
  }

  private environmentEnd(text: string, start: number, name: string) {
    const pattern = /\\(begin|end)\{(\w+\*?)\}/g;
    pattern.lastIndex = start;
    let depth = 0;
    for (let match; (match = pattern.exec(text));) {
      if (match[2] !== name) continue;
      depth += match[1] === "begin" ? 1 : -1;
      if (depth === 0) return { bodyEnd: match.index, end: match.index + match[0].length };
    }
    throw new Error(`Unclosed environment ${name}`);
  }

  private environment(name: string, raw: string): string {
    let body = raw;
    let number: string | undefined;
    const marker = body.match(/^\u0005([^\u0005]*)\u0005/);
    if (marker) { number = marker[1]; body = body.slice(marker[0].length); }
    const [option, afterOption] = readGroup(body, 0, true);
    body = body.slice(afterOption);
    const [label, afterLabel] = this.followingLabel(body);
    if (label) body = body.slice(afterLabel);
    const id = label ? ` id="${slugify(label)}"` : "";

    if (name in THEOREMS || name === "assumption" || name === "asmset") {
      const title = name === "asmset" ? "Assumptions" : name === "assumption" ? "Assumption" : THEOREMS[name];
      const note = option ? ` (${this.inline(option)})` : "";
      // thmtools styles of the PDF: "thm" sets the body in italics, "defn" upright.
      const kind = ["definition", "example", "remark", "assumption", "asmset"].includes(name) ? "plain" : "theorem";
      const head = `<strong class="thm-head">${title}${number ? ` ${number}` : ""}${note}.</strong> `;
      return `<div class="thm thm-${kind}"${id}>${runIn(head, this.blocksToHtml(body.replace(/^\s*\\leavevmode/, "")))}</div>`;
    }
    switch (name) {
      case "whybox": {
        const [question, after] = readGroup(body, 0);
        return `<aside class="why"><p class="why-head"><span class="sc">Why</span> <em>${this.inline(question ?? "")}</em></p>${this.blocksToHtml(body.slice(after))}</aside>`;
      }
      case "proof":
        // amsthm: run-in italic "Proof." and a tombstone at the end of the last line.
        return `<div class="proof">${runIn(`<em class="proof-head">${option ? this.inline(option) : "Proof"}.</em> `, this.blocksToHtml(body), '<span class="qed" aria-hidden="true">∎</span>')}</div>`;
      case "itemize":
      case "enumerate":
      case "description":
        return this.list(name, option, body);
      case "table":
      case "figure":
        return this.float(name, number ?? "", body, id);
      case "tabular":
        return this.tabular(readGroup(body, 0)[1], body);
      case "center":
      case "minipage":
        return this.blocksToHtml(name === "minipage" ? body.slice(readGroup(body, 0)[1]) : body);
      case "tikzpicture":
        return this.pdfFallback();
      default:
        this.warnings.add(`unknown environment ${name}`);
        return this.blocksToHtml(body);
    }
  }

  private list(name: string, option: string | undefined, body: string) {
    const items = splitTopLevel(body, /\\item(?![a-zA-Z])/).parts.slice(1).map((content) => {
      const [label, after] = readGroup(content, 0, true);
      let html = this.blocksToHtml(content.slice(after));
      if (/^<p>[\s\S]*<\/p>$/.test(html) && html.indexOf("<p>", 1) === -1) html = html.slice(3, -4);
      return `<li>${label ? `<strong>${this.inline(label)}</strong> ` : ""}${html}</li>`;
    });
    if (name === "enumerate") {
      const style = option?.includes("\\roman") ? ' class="list-roman"' : option?.includes("\\alph") ? ' class="list-alpha"' : "";
      return `<ol${style}>${items.join("")}</ol>`;
    }
    return `<ul${name === "description" ? ' class="list-plain"' : ""}>${items.join("")}</ul>`;
  }

  private float(kind: "table" | "figure", number: string, body: string, id: string) {
    let caption = "";
    let label: string | undefined;
    const content = this.replaceCommand(body, "caption", 1, ([text], rest) => {
      caption = text;
      const [found, consumed] = this.followingLabel(rest);
      label = found;
      return ["", consumed];
    }).replace(/\\label\{([^}]+)\}/, (_, found) => { label ??= found; return ""; });
    const anchor = label ? ` id="${slugify(label)}"` : id;
    const captionHtml = `<span class="float-label">${kind === "table" ? "Table" : "Figure"}&nbsp;${number}.</span> ${this.inline(caption)}`;
    if (kind === "table") {
      return `<figure class="table-float"${anchor}><figcaption>${captionHtml}</figcaption>${this.blocksToHtml(content)}</figure>`;
    }
    const figure = label && this.meta.figures?.[label];
    if (figure) return `<figure data-figure="${figure}"${anchor}>${captionHtml}</figure>`;
    return `<figure class="static-figure"${anchor}>${this.pdfFallback()}<figcaption>${captionHtml}</figcaption></figure>`;
  }

  private pdfFallback() {
    return `<p class="figure-fallback">This figure is drawn in TikZ; see the <a href="${this.pdf}">PDF version</a>.</p>`;
  }

  private tabular(specEnd: number, body: string) {
    const content = body.slice(specEnd).replace(/\\(toprule|bottomrule|hline)\b/g, "").replace(/\\cmidrule(\([^)]*\))?\{[^}]*\}/g, "");
    const [head, rest] = content.includes("\\midrule") ? content.split("\\midrule", 2) : ["", content];
    const rows = (source: string, cell: "th" | "td") => splitTopLevel(source, /\\\\/).parts
      .filter((row) => row.trim())
      .map((row) => `<tr>${row.split(/(?<!\\)&/).map((value) => `<${cell}>${this.inline(value.trim())}</${cell}>`).join("")}</tr>`)
      .join("");
    return `<div class="table-wrap"><table>${head.trim() ? `<thead>${rows(head, "th")}</thead>` : ""}<tbody>${rows(rest.replace(/\\midrule/g, ""), "td")}</tbody></table></div>`;
  }

  // ---- inline text
  inline(raw: string): string {
    const escapes: string[] = [];
    const keep = (html: string) => { escapes.push(html); return `\u0002${escapes.length - 1}\u0002`; };
    let text = raw
      .replace(/\\([&%$#_{}])/g, (_, char) => keep(escapeHtml(char)))
      .replace(/\\\\(\[[^\]]*\])?/g, () => keep("<br>"));
    text = escapeHtml(text);
    text = this.convertInline(text, keep);
    return text
      .replace(/\u0002(\d+)\u0002/g, (_, index) => escapes[Number(index)])
      // An inline formula and the punctuation after it never split across lines.
      .replace(/\u0001(\d+)\u0001([.,;:!?)]+)?/g, (_, index, punct) => {
        const html = this.formulas[Number(index)];
        return punct && !html.startsWith('<br class="eq">') ? `<span class="nobr">${html}${punct}</span>` : `${html}${punct ?? ""}`;
      })
      .replace(/⟦([^⟧]+)⟧/g, (_, label) => this.labels.get(label)?.number ?? "??");
  }

  private convertInline(input: string, keep: (html: string) => string): string {
    let text = input;
    const wrap: Record<string, [string, string]> = {
      emph: ["<em>", "</em>"], textit: ["<em>", "</em>"], textbf: ["<strong>", "</strong>"],
      textsc: ['<span class="sc">', "</span>"], texttt: ["<code>", "</code>"], textup: ["", ""],
      textnormal: ["", ""], textrm: ["", ""], mbox: ["", ""], text: ["", ""], underline: ["<u>", "</u>"],
    };
    for (const [command, [open, close]] of Object.entries(wrap)) {
      text = this.replaceCommand(text, command, 1, ([arg]) => [keep(`${open}${this.convertInline(arg, keep)}${close}`), 0]);
    }
    text = this.replaceCommand(text, "runin", 2, ([id, title]) =>
      [keep(`<strong class="runin"${id ? ` id="${id}"` : ""}>${this.convertInline(title, keep)}.</strong>`), 0]);
    text = this.replaceCommand(text, "eqref", 1, ([label]) => [keep(this.reference(label, true)), 0]);
    text = this.replaceCommand(text, "ref", 1, ([label]) => [keep(this.reference(label, false)), 0]);
    text = this.replaceCommand(text, "href", 2, ([url, label]) => [keep(`<a href="${url}">${this.convertInline(label, keep)}</a>`), 0]);
    text = this.replaceCommand(text, "url", 1, ([url]) => [keep(`<a href="${url}">${url}</a>`), 0]);
    for (const [command, arity] of [["label", 1], ["vspace", 1], ["hspace", 1], ["addcontentsline", 3], ["markboth", 2], ["thispagestyle", 1], ["setstretch", 1], ["phantom", 1], ["setlength", 2]] as const) {
      text = this.replaceCommand(text, `${command}\\*?`, arity, () => ["", 0]);
    }
    const accents: Record<string, string> = { "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃", "=": "̄", ".": "̇", c: "̧", v: "̌", u: "̆", H: "̋" };
    text = text
      .replace(/\\(['`^"~=.])\{?([A-Za-z])\}?/g, (_, accent, letter) => `${letter}${accents[accent]}`.normalize("NFC"))
      .replace(/\\([cvuH])\{([A-Za-z])\}/g, (_, accent, letter) => `${letter}${accents[accent]}`.normalize("NFC"))
      .replace(/\\(ldots|dots|textellipsis)(?![a-zA-Z])/g, "…")
      .replace(/\\(O|o|ss|ae|AE|l|L|i)(?![a-zA-Z])/g, (_, letter) => ({ O: "Ø", o: "ø", ss: "ß", ae: "æ", AE: "Æ", l: "ł", L: "Ł", i: "ı" })[letter as "O"])
      .replace(/\\S(?![a-zA-Z])/g, "§")
      .replace(/\\(qquad|quad|enspace|thinspace|,|;|:|!|\s)/g, (_, space) => (space === "!" ? "" : " "))
      .replace(/\\(small|footnotesize|scriptsize|normalsize|large|Large|LARGE|huge|centering|noindent|raggedright|raggedleft|bfseries|itshape|scshape|normalfont|upshape|smallskip|medskip|bigskip|leavevmode|qedhere|newpage|clearpage|par|@|-|item)(?![a-zA-Z])/g, "")
      .replace(/\\(\w+)/g, (match, name) => {
        const body = this.macros[`\\${name}`];
        if (body !== undefined && !body.includes("\\")) return body;
        this.warnings.add(`unknown command \\${name}`);
        return "";
      })
      .replace(/``/g, "“").replace(/''/g, "”").replace(/`/g, "‘")
      .replace(/---/g, "—").replace(/--/g, "–")
      .replace(/~/g, " ")
      .replace(/[{}]/g, "");
    return text;
  }

  private reference(label: string, equation: boolean) {
    const target = this.labels.get(label);
    if (!target) {
      this.warnings.add(`unresolved reference ${label}`);
      return "??";
    }
    const page = target.chapter === this.chapter ? "" : `/notes/${this.course}/${target.chapter}/`;
    const href = target.kind === "section" ? page || "#top" : `${page}#${target.id}`;
    return `<a class="ref" href="${href}">${equation ? `(${target.number})` : target.number}</a>`;
  }

  registerSection(label: string, number: string, chapter: string) {
    this.labels.set(label, { number, chapter, id: "", kind: "section" });
  }
}

// ---------------------------------------------------------------- course loading

function loadCourse(slug: string): NoteCourse {
  const directory = join(ROOT, slug);
  const meta = JSON.parse(readFileSync(join(directory, "meta.json"), "utf8")) as Meta;
  const source = readFileSync(join(directory, "notes.tex"), "utf8").replace(/(?<!\\)%.*$/gm, "");
  const [preamble, rest] = source.split("\\begin{document}");
  const document = rest.split("\\end{document}")[0];
  const pdf = `/notes/${slug}.pdf`;
  const converter = new Converter(slug, parseMacros(preamble), meta, pdf);

  const contentsAt = document.indexOf("\\tableofcontents");
  const body = document.slice(contentsAt >= 0 ? contentsAt : 0);
  const mainStart = body.search(/\\(part|section)\*?\{/);
  const main = converter.extractMath(body.slice(mainStart));

  // Split into chapters at \section; \part titles group the chapters that follow.
  type Raw = { slug: string; number: string | null; title: string; part?: string; text: string };
  const raws: Raw[] = [];
  let part: string | undefined;
  let sectionNumber = 0;
  const heading = /\\(part|section)(\*?)\{/g;
  const marks: { kind: string; star: string; start: number; titleEnd: number; title: string }[] = [];
  for (let match; (match = heading.exec(main));) {
    const end = groupEnd(main, match.index + match[0].length - 1);
    marks.push({ kind: match[1], star: match[2], start: match.index, titleEnd: end, title: main.slice(match.index + match[0].length, end - 1) });
    heading.lastIndex = end;
  }
  marks.forEach((mark, index) => {
    const text = main.slice(mark.titleEnd, marks[index + 1]?.start ?? main.length);
    if (mark.kind === "part") { part = converter.inline(mark.title); return; }
    const number = mark.star ? null : String((sectionNumber += 1));
    const plain = converter.inline(mark.title).replace(/<[^>]+>/g, "");
    const chapterSlug = `${number ?? "0"}-${slugify(plain).split("-").slice(0, 6).join("-")}`;
    const label = text.match(/^\s*\\label\{([^}]+)\}/);
    if (label && number) converter.registerSection(label[1], number, chapterSlug);
    raws.push({ slug: chapterSlug, number, title: mark.title, part, text: label ? text.slice(label[0].length) : text });
  });

  const numbered = raws.map((raw) => ({ ...raw, text: converter.number(raw.slug, raw.number, raw.text) }));
  const chapters = numbered.map((raw) => {
    const { html, sections } = converter.render(raw.slug, raw.text);
    const title = converter.inline(raw.title);
    return { slug: raw.slug, number: raw.number, title, plainTitle: title.replace(/<[^>]+>/g, ""), part: raw.part, html, sections };
  });

  for (const warning of converter.warnings) console.warn(`[notes:${slug}] ${warning}`);
  return {
    kind: "course",
    slug,
    ...meta,
    pdf,
    source: `/notes/${slug}/source.tex`,
    chapters,
  };
}

function loadPage(slug: string): NotePage {
  const { data, content } = matter(readFileSync(join(ROOT, slug, "index.md"), "utf8"));
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "");
  return { kind: "page", slug, title: String(data.title), section: String(data.section), date, order: Number(data.order ?? 0), html: renderMarkdown(content) };
}

let cache: Note[] | undefined;
/** All notes, newest first within equal `order`. */
export function getNotes(): Note[] {
  cache ??= readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => existsSync(join(ROOT, entry.name, "notes.tex")) ? loadCourse(entry.name) : loadPage(entry.name))
    .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));
  return cache;
}

export const getNote = (slug: string) => getNotes().find((note) => note.slug === slug);
export const getCourses = () => getNotes().filter((note): note is NoteCourse => note.kind === "course");
export const getCourse = (slug: string) => getCourses().find((course) => course.slug === slug);
export const noteSections: NoteSectionGroup[] = JSON.parse(readFileSync(join(ROOT, "sections.json"), "utf8"));
