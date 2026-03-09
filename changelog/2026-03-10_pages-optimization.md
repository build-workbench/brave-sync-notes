# GitHub Pages Optimization (2026-03-10)

## Changes

### `_config.yml`
- Added SEO metadata: `url`, `baseurl`, `lang`
- Added `exclude` list to skip `brave-sync-notes/`, `node_modules/`, and other non-doc files from Jekyll build — reduces build time and artifact size

### `.github/workflows/pages.yml`
- Refined `paths` trigger — replaced broad `*.md` with specific files (`index.md`, `README.md`, `README.zh-CN.md`, `changelog/**`); removed non-existent `docs/**`
- Fixed `sparse-checkout` — removed non-existent `docs` dir, added `index.md` (the actual landing page)
- Set `cancel-in-progress: true` for faster iteration on concurrent pushes

### `index.md`
- Added GitHub Pages deployment status badge

### `.gitignore`
- Added Jekyll build artifacts: `_site/`, `.jekyll-cache/`, `.jekyll-metadata`, `Gemfile.lock`
