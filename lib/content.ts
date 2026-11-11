import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import profile from "@/content/profile.json";
import { renderDelimited } from "./math";

const CONTENT = join(process.cwd(), "content");

export type Publication = {
  citekey: string;
  type: string;
  title: string;
  authors: string;
  year: string;
  venue: string;
  doi?: string;
  url?: string;
  pdf?: string;
  code?: string;
  abstract?: string;
};

export function renderMarkdown(source: string) {
  const formulas: string[] = [];
  // Code fences go to marked untouched; `$` inside them is never TeX.
  const protectedSource = source
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part, index) => index % 2 ? part : part.replace(
      /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?(?<!\\)\$/g,
      (formula) => `MATHPLACEHOLDER${formulas.push(renderDelimited(formula)) - 1}TOKEN`,
    ))
    .join("");
  return (marked.parse(protectedSource, { gfm: true }) as string)
    .replace(/MATHPLACEHOLDER(\d+)TOKEN/g, (_, index) => formulas[Number(index)]);
}

function cleanBibText(value = "") {
  return value
    .replace(/[{}]/g, "")
    .replace(/\\&/g, "&")
    .replace(/\\textit|\\emph/g, "")
    .replace(/~/g, " ")
    .trim();
}

function parseFields(body: string) {
  const fields: Record<string, string> = {};
  let start = 0;
  let depth = 0;
  let quoted = false;
  const chunks: string[] = [];
  for (let index = 0; index <= body.length; index += 1) {
    const char = body[index];
    if (char === '"' && body[index - 1] !== "\\") quoted = !quoted;
    if (!quoted && char === "{") depth += 1;
    if (!quoted && char === "}") depth -= 1;
    if ((char === "," && depth === 0 && !quoted) || index === body.length) {
      chunks.push(body.slice(start, index));
      start = index + 1;
    }
  }
  for (const chunk of chunks) {
    const match = chunk.match(/^\s*([\w-]+)\s*=\s*([\s\S]*)$/);
    if (!match) continue;
    fields[match[1].toLowerCase()] = cleanBibText(match[2].replace(/^\s*[{"]|[}"]\s*$/g, ""));
  }
  return fields;
}

function parseBibtex(source: string): Publication[] {
  const publications: Publication[] = [];
  let cursor = 0;
  while ((cursor = source.indexOf("@", cursor)) >= 0) {
    const header = source.slice(cursor).match(/^@(\w+)\s*[{(]\s*([^,]+),/);
    if (!header) { cursor += 1; continue; }
    const open = source.indexOf(header[0].includes("{") ? "{" : "(", cursor);
    let depth = 1;
    let quoted = false;
    let end = open + 1;
    for (; end < source.length && depth > 0; end += 1) {
      const char = source[end];
      if (char === '"' && source[end - 1] !== "\\") quoted = !quoted;
      if (!quoted && (char === "{" || char === "(")) depth += 1;
      if (!quoted && (char === "}" || char === ")")) depth -= 1;
    }
    const citekey = header[2].trim();
    const comma = source.indexOf(",", open);
    const fields = parseFields(source.slice(comma + 1, end - 1));
    publications.push({

      citekey,
      type: header[1].toLowerCase(),
      title: fields.title || citekey,
      authors: fields.author || "",
      year: fields.year || "",
      venue: fields.journal || fields.booktitle || fields.school || fields.institution || "",
      doi: fields.doi,
      url: fields.url,
      pdf: fields.pdf,
      code: fields.code,
      abstract: fields.abstract,
    });
    cursor = end;
  }
  return publications;
}

async function importDoi(doi: string): Promise<Publication> {
  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const item = (await response.json()).message;
    const authors = (item.author || [])
      .map((author: { given?: string; family?: string }) => [author.given, author.family].filter(Boolean).join(" "))
      .join(" and ");
    const year = item.published?.["date-parts"]?.[0]?.[0] || item.issued?.["date-parts"]?.[0]?.[0] || "";
    return {
      citekey: doi, type: item.type || "article", title: item.title?.[0] || doi,
      authors, year: String(year), venue: item["container-title"]?.[0] || item.publisher || "", doi,
      url: item.URL, abstract: item.abstract,
    };
  } catch {
    return { citekey: doi, type: "doi", title: doi, authors: "", year: "", venue: "", doi };
  }
}

async function loadPublications(): Promise<Publication[]> {
  const bib = parseBibtex(readFileSync(join(CONTENT, "publications.bib"), "utf8"));
  const dois = readFileSync(join(CONTENT, "dois.txt"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !bib.some((entry) => entry.doi?.toLowerCase() === line.toLowerCase()));
  const imported = await Promise.all(dois.map(importDoi));
  return [...bib, ...imported].sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title));
}

let publicationCache: Promise<Publication[]> | undefined;
export function getPublications() {
  publicationCache ??= loadPublications();
  return publicationCache;
}

export { profile };
export type Profile = typeof profile;
