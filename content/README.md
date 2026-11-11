# Academic content

This directory is the source of truth for the site.

- `profile.json`: name, role, bio, research interests, education and experience. The home
  page shows the profile; education and experience appear on the CV.
- `publications.bib`: BibTeX entries, listed on the Research page. Optional fields:
  `abstract`, `pdf`, `code`, `url`, `doi`.
- `dois.txt`: one DOI per line; Crossref metadata is resolved during the build.
- `notes/sections.json`: the shelves of the Notes page and their order.
- `notes/<slug>/`: one note per folder, in one of two forms.
  - LaTeX course: `meta.json` (`title`, `section`, `course`, `institution`, `date`,
    `order`). Put the compiled PDF and its source in `public/notes/<slug>.pdf` and
    `public/notes/<slug>.tex`; the Notes page links to both.
  - Markdown note: `index.md` with front matter `title`, `date`, `section`, rendered as a
    page. Raw HTML is allowed; interactive figures are one-line placeholders such as
    `<figure data-figure="taylor-zlb">Caption with $math$.</figure>`.

`section` is a section id, or `section/group` for a shelf with groups, for example
`gerzensee/metrics` or `others`.

Math in Markdown notes is TeX (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`), rendered to MathML at build time.
