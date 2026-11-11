# Academic content

This directory is the source of truth for the site.

- `profile.json`: name, role, bio, research interests, education and experience. The home
  page shows the profile; education and experience appear on the CV.
- `publications.bib`: BibTeX entries, listed on the Research page. Optional fields:
  `abstract`, `pdf`, `code`, `url`, `doi`.
- `dois.txt`: one DOI per line; Crossref metadata is resolved during the build.
- `notes/sections.json`: the shelves of the Notes page and their order.
- `notes/<slug>/`: one note per folder, in one of two forms.
  - LaTeX course: `notes.tex` plus `meta.json` (`title`, `section`, `course`,
    `institution`, `date`, `order`, `credit`, and `figures`, which maps a figure `\label`
    to an interactive figure id). Each `\section` becomes a chapter page and `\part`
    groups them. Put the compiled PDF in `public/notes/<slug>.pdf`; the TeX is served
    at `/notes/<slug>/source.tex`. Unmapped TikZ figures point readers to the PDF.
  - Markdown note: `index.md` with front matter `title`, `date`, `section`. Raw HTML and
    `<script>` blocks are allowed; interactive figures are one-line placeholders such as
    `<figure data-figure="taylor-zlb">Caption with $math$.</figure>`.

`section` is a section id, or `section/group` for a shelf with groups, for example
`gerzensee/metrics` or `others`.

All mathematics is TeX (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`), rendered to MathML at build time.
