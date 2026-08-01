# jfu26.github.io

Academic website for an incoming Economics PhD researcher at the Geneva
Graduate Institute.

## Development

```bash
pnpm install
pnpm data
pnpm dev
```

`pnpm data` reads the complete IMF WEO and harmonized Global Macro Database
indicator sets into ignored, per-indicator build assets. It also creates the
complete DBnomics/WDI catalog; DBnomics observations load on demand in the
browser. The repository never tracks generated data files.

## Publishing

Every push to `main` builds and publishes the static site with GitHub Pages.
The same workflow refreshes IMF WEO, Global Macro Database, and DBnomics data
daily at 03:17 UTC. Generated data exist only in the deployment artifact.
