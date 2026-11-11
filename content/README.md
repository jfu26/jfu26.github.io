# Academic content

This directory is the source of truth for research content.

- `publications.bib`: BibTeX entries. Standard and custom links are rendered automatically.
- `dois.txt`: one DOI per line. Crossref metadata is resolved during the build.
- `profile.json`: name, role, bio, research interests, education and experience. Feeds the home, Research, and CV pages; experience appears on the CV only.
- `posts/`: Markdown (`.md`), RMarkdown (`.Rmd`), and HTML (`.html`) notes with front matter.
  Markdown may embed raw HTML and `<script>` blocks; scripts run in the browser in
  document order. Interactive figures are placeholders on one line,
  `<figure data-figure="taylor-zlb">Caption with $math$.</figure>`, where the id is a
  component registered in `components/figures/index.ts`.
- `notes/<course>/`: LaTeX lecture notes, published as chaptered HTML under `/notes/`.
  - `notes.tex`: the full document. Each `\section` becomes a chapter page and `\part` groups
    them. Supported: macros from the preamble, theorem-like environments, `whybox`, `proof`,
    `align`/`equation` with labels, `\ref`/`\eqref` across chapters, lists, booktabs tables.
  - `meta.json`: `title`, `course`, `institution`, `term`, `date`, `order`, `credit`, and
    `figures`, mapping a figure `\label` to an interactive figure id. Unmapped TikZ figures
    point readers to the PDF.
  - The compiled PDF goes in `public/notes/<course>.pdf`; the TeX is served at
    `/notes/<course>/source.tex`.
- `notebooks/`: Jupyter notebooks. Add display metadata under `metadata.jfu26`.
- `slides/`: reveal.js Markdown decks. Separate horizontal slides with `---`.

Required Markdown front matter:

```yaml
---
title: Post title
date: 2026-08-01
summary: One-sentence abstract.
tags: [Macroeconomics, Theory]
---
```

All mathematics is written as TeX using `$...$` or `$$...$$` and rendered to MathML at build time by Temml.
