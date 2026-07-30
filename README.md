# jfu26.github.io

Academic website for an incoming Economics PhD researcher at the Geneva
Graduate Institute.

## Development

```bash
pnpm install
pnpm data
pnpm dev
```

`pnpm data` reads current public macroeconomic sources into ignored local build
assets. The repository never tracks these generated files.

## Publishing

Every push to `main` builds and publishes the static site with GitHub Pages.
The same workflow refreshes IMF WEO, Global Macro Database, and DBnomics data
daily at 03:17 UTC. Generated data exist only in the deployment artifact.
