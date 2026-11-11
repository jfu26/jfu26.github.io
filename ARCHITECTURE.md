# Website architecture

The site is a statically exported Next.js academic website. Content, rendering,
and routes have separate responsibilities.

```text
content/                  Human-owned academic source files
  profile.json           Name, role, interests, education, experience (home, Research, CV)
  publications.bib       BibTeX publication records
  dois.txt               DOI records imported from Crossref at build time
  posts/                  Markdown, RMarkdown, and HTML notes (inline HTML/JS allowed)
  notebooks/              Jupyter notebooks with code and stored outputs
  slides/                 reveal.js Markdown decks
lib/content.ts            Parsing and normalization boundary
components/               Shared academic layout and content renderers
  Prose.tsx              Renders post HTML and runs its <script> tags in order
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
- `lib/content.ts` is the only module that reads the content filesystem.
- Components render normalized content and contain no source-specific parsing.
- Route files compose layouts, metadata, and static parameters only.
- Profile and CV facts live in `content/profile.json`, never in page markup.
- Colors are CSS tokens in `app/globals.css`; dark mode redefines the tokens only.
- Generated macro data and build output are never committed.
