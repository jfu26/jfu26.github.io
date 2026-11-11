// Fails the build early on malformed notes: each folder is a LaTeX course
// (meta.json + public/notes/<slug>.pdf and .tex) or a Markdown note (index.md),
// and every note belongs to a section declared in content/notes/sections.json.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const root = join(process.cwd(), "content", "notes");
const sections = JSON.parse(readFileSync(join(root, "sections.json"), "utf8"))
  .flatMap((s) => (s.groups ? s.groups.map((g) => `${s.id}/${g.id}`) : [s.id]));
const errors = [];
let count = 0;

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join(root, entry.name);
  const where = `content/notes/${entry.name}`;
  let fields;
  if (existsSync(join(dir, "meta.json"))) {
    fields = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
    for (const key of ["title", "course", "institution", "date", "order"]) if (fields[key] === undefined) errors.push(`${where}/meta.json: missing ${key}`);
    for (const ext of ["pdf", "tex"]) if (!existsSync(join(process.cwd(), "public", "notes", `${entry.name}.${ext}`))) errors.push(`${where}: missing public/notes/${entry.name}.${ext}`);
  } else if (existsSync(join(dir, "index.md"))) {
    const { data, content } = matter(readFileSync(join(dir, "index.md"), "utf8"));
    fields = data;
    for (const key of ["title", "date"]) if (!data[key]) errors.push(`${where}/index.md: missing ${key}`);
    if (!content.trim()) errors.push(`${where}/index.md: empty body`);
  } else {
    errors.push(`${where}: expected meta.json or index.md`);
    continue;
  }
  if (!sections.includes(fields.section)) errors.push(`${where}: section "${fields.section}" is not in sections.json (${sections.join(", ")})`);
  count += 1;
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Content validated: ${count} notes.`);
