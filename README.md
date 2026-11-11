# jfu26.github.io

Academic website of a PhD student in International Economics at the Geneva
Graduate Institute (IHEID), working in macroeconomics: a statically exported Next.js
site with a profile, research (BibTeX/DOI), CV, LaTeX and Markdown notes rendered to
chaptered HTML with build-time MathML, and a global macro data atlas.

## Development

```bash
pnpm install
pnpm data
pnpm dev
```

Run `pnpm content:check` to validate notes and their sections. See
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
