# Website architecture

The site is a statically exported Next.js academic website. Content, rendering,
and routes have separate responsibilities.

```text
content/                  Human-owned academic source files
  profile.json           Name, role, interests, education, experience (home, Research, CV)
  publications.bib       BibTeX publication records
  dois.txt               DOI records imported from Crossref at build time
  notes/<course>/         LaTeX lecture notes: notes.tex + meta.json (PDF in public/notes/)
  posts/                  Markdown, RMarkdown, and HTML notes (inline HTML/JS allowed)
  notebooks/              Jupyter notebooks with code and stored outputs
  slides/                 reveal.js Markdown decks
lib/content.ts            Parsing and normalization boundary for posts, slides, papers, profile
lib/notes.ts              LaTeX → chaptered HTML converter for content/notes (numbering, refs, environments)
lib/math.ts               Build-time TeX → MathML (Temml); no math JavaScript ships to readers
components/               Shared academic layout and content renderers
  RichHtml.tsx           Renders build-time HTML and mounts <figure data-figure="id"> placeholders
  figures/               Interactive SVG figures (draggable, keyboard-operable), one chunk each
  Prose.tsx              Runs author <script> tags in order, for HTML that still carries them
app/(site)/               Site pages sharing one header/footer layout
app/slides/               Full-screen reveal.js decks, outside the site shell
scripts/                  Content validation and macro-data ingestion
public/data/              Generated deployment data; ignored by Git
```

## Build flow

1. `pnpm content:check` validates front matter, notebook metadata, and unique slugs.
2. `pnpm data` retrieves macroeconomic data into ignored, per-indicator files.
3. `next build` reads academic content, imports DOI metadata, generates every
   dynamic route through `generateStaticParams`, and exports the site to `out/`.
4. GitHub Actions publishes `out/` to GitHub Pages.

## Ownership rules

- Research content belongs under `content/`, never in a React component.
- `lib/content.ts` and `lib/notes.ts` are the only modules that read the content filesystem.
- Math is rendered at build time to MathML; pages load no math library. Slides are the
  exception: reveal renders Markdown in the browser, so decks use its KaTeX plugin.
- Interactive figures are React SVG components registered in `components/figures/index.ts`
  and referenced from content by id; content never ships plotting libraries or inline JS.
- Components render normalized content and contain no source-specific parsing.
- Route files compose layouts, metadata, and static parameters only.
- Profile and CV facts live in `content/profile.json`, never in page markup.
- Colors are CSS tokens in `app/globals.css`, defined with `light-dark()` for both schemes.
- Generated macro data and build output are never committed.
