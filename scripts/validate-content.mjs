import { readFileSync, readdirSync } from "node:fs";
import { extname, join, parse } from "node:path";
import matter from "gray-matter";

const root = join(process.cwd(), "content");
const errors = [];
const slugs = new Set();
const required = ["title", "date", "summary"];

function recordSlug(file) {
  const slug = parse(file).name;
  if (slugs.has(slug)) errors.push(`Duplicate content slug: ${slug}`);
  slugs.add(slug);
}

function validateMarkdown(directory) {
  for (const file of readdirSync(join(root, directory))) {
    if (![".md", ".rmd"].includes(extname(file).toLowerCase())) continue;
    recordSlug(file);
    const { data, content } = matter(readFileSync(join(root, directory, file), "utf8"));
    for (const field of required) if (!data[field]) errors.push(`${directory}/${file}: missing ${field}`);
    if (!content.trim()) errors.push(`${directory}/${file}: empty body`);
  }
}

validateMarkdown("posts");
validateMarkdown("slides");

for (const file of readdirSync(join(root, "notebooks"))) {
  if (extname(file) !== ".ipynb") continue;
  recordSlug(file);
  const notebook = JSON.parse(readFileSync(join(root, "notebooks", file), "utf8"));
  for (const field of required) if (!notebook.metadata?.jfu26?.[field]) errors.push(`notebooks/${file}: missing metadata.jfu26.${field}`);
  if (notebook.nbformat !== 4) errors.push(`notebooks/${file}: expected nbformat 4`);
  if (!notebook.cells?.length) errors.push(`notebooks/${file}: no cells`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Content validated: ${slugs.size} posts, notebooks, and slide decks.`);
