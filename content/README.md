# Academic content

This directory is the source of truth for research content.

- `publications.bib`: BibTeX entries. Standard and custom links are rendered automatically.
- `dois.txt`: one DOI per line. Crossref metadata is resolved during the build.
- `profile.json`: name, role, bio, research interests, education, and experience shown on the home page.
- `posts/`: Markdown (`.md`), RMarkdown (`.Rmd`), and HTML (`.html`) notes with front matter.
  Markdown may embed raw HTML and `<script>` blocks; scripts run in the browser
  (see `taylor-rule-explorer.md`). Wrap interactive controls in `<div class="widget">`.
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

All mathematics is written as TeX using `$...$` or `$$...$$` and rendered by MathJax.
