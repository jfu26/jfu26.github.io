# jfu26.github.io

Academic website of a PhD student in International Economics at the Geneva
Graduate Institute (IHEID), working in macroeconomics. The site combines an al-folio-style academic content architecture
with static Markdown, LaTeX lecture notes, BibTeX, DOI, Jupyter, RMarkdown, build-time MathML (Temml), and reveal.js
publishing.

## Development

```bash
pnpm install
pnpm data
pnpm dev
```

Run `pnpm content:check` to validate content metadata and duplicate slugs. See
[`ARCHITECTURE.md`](ARCHITECTURE.md) and [`content/README.md`](content/README.md)
for the content model and authoring conventions.

`pnpm data` reads the complete IMF WEO and harmonized Global Macro Database
indicator sets into ignored, per-indicator build assets. It also creates the
complete DBnomics/WDI catalog; DBnomics observations load on demand in the
browser. The repository never tracks generated data files.

## Publishing

Every push to `main` builds and publishes the static site with GitHub Pages.
The same workflow refreshes IMF WEO, Global Macro Database, and DBnomics data
daily at 03:17 UTC. Generated data exist only in the deployment artifact.
