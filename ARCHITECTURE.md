# Website architecture

A statically exported Next.js site. Content, parsing and presentation are separate.

```text
content/                    Human-owned source (see content/README.md)
  profile.json              Name, role, bio, interests, education, experience
  publications.bib, dois.txt Papers listed on Research
  notes/sections.json       Notes shelves: Gerzensee (micro/macro/metrics), Master, Others
  notes/<slug>/             meta.json (LaTeX course, PDF + TeX in public/notes) or index.md
lib/
  content.ts                Profile, Markdown rendering, BibTeX/DOI parsing
  notes.ts                  Notes loader (course metadata, Markdown pages)
  math.ts                   TeX → MathML (Temml) at build time, for Markdown notes
components/
  RichHtml.tsx              Build-time HTML + mounts <figure data-figure="id"> figures
  figures/                  Interactive SVG figures (drag + keyboard), one chunk each
  CvList.tsx, Site*.tsx, PrintButton.tsx
app/
  layout.tsx, globals.css   Root document, fonts, base styles, Person JSON-LD
  fonts/                    Self-hosted TeX Gyre Pagella text + math (GUST licence)
  (site)/                   Home, research, notes, cv, macro (shared header/footer)
  (site)/macro/atlas.css    Atlas-only styles
  sitemap.ts, robots.ts
scripts/                    Content validation, macro-data ingestion
```

## Build flow

1. `pnpm content:check` validates every notes folder and its section.
2. `pnpm data` downloads macro data into ignored files under `public/data/`.
3. `next build` renders all pages and Markdown notes to static HTML in `out/`.
4. GitHub Actions publishes `out/` to GitHub Pages on every push to `main`.

## Rules

- Research content lives under `content/`; components never contain it.
- Only `lib/` reads the filesystem; routes compose layout, metadata and static params.
- Math is MathML rendered at build time: pages ship no math JavaScript. Display big
  operators (`\sum`, `\max`) set their limits under the symbol;
  inline math keeps TeX's side limits so running text keeps an even leading.
- Interactive figures are SVG components registered in `components/figures/index.ts`
  and referenced from content by id. Content does not load plotting libraries.
- Styles are plain CSS with nesting and `light-dark()` tokens; each route imports only
  the stylesheet it needs.
- Generated data and build output are never committed.
