---
title: Contributing Guide
description: Contribution workflow, validation commands, and documentation/changelog expectations for Note Sync Now.
permalink: /contributing/
---

# Contributing to Note Sync Now / Brave Sync Notes

Thank you for your interest in contributing.

## Navigation

- Docs home: <https://lessup.github.io/brave-sync-notes/>
- Repository overview: <https://lessup.github.io/brave-sync-notes/overview/>
- Changelog: <https://lessup.github.io/brave-sync-notes/changelog/>

## Ways to contribute

- Report bugs and request features via GitHub Issues.
- Improve documentation and examples.
- Submit pull requests for bug fixes or new features.

## Workflow

1. Fork the repository and create a feature branch:
   - `git checkout -b feature/your-feature-name`
2. Make your changes in small, focused commits.
3. Run the relevant validation locally:
   - `cd brave-sync-notes/client && npm ci && npm test -- --run && npm run build`
   - `cd brave-sync-notes/server && npm ci && npm test`
   - `cd brave-sync-notes/server && npm run test:property` (recommended when touching sync, persistence, or validation logic)
4. Add or update a record in `changelog/` for every submitted change set.
5. Open a pull request with a clear description of the change and related issue(s).

## Documentation expectations

- Keep root documentation aligned with the GitHub Pages site.
- Prefer updating the relevant overview / architecture / deployment / security page instead of duplicating explanations across files.
- When changing workflows or project structure, update both the docs page and the changelog entry in the same change set.

## Code style

- Keep functions small and focused.
- Prefer clear naming over short names.
- Reuse existing test frameworks and project structure before introducing new tooling.

## Commit messages

- Use descriptive commit messages.
- Optionally follow the conventional commits style (e.g. `feat:`, `fix:`, `docs:`).

## Security

- Do not commit secrets (API keys, passwords, tokens).
- If you discover a security issue, please report it privately instead of creating a public issue first.
