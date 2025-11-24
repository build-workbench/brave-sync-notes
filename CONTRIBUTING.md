# Contributing to Note Sync Now / Brave Sync Notes

Thank you for your interest in contributing!

## Ways to contribute

- Report bugs and request features via GitHub Issues.
- Improve documentation and examples.
- Submit pull requests for bug fixes or new features.

## Workflow

1. Fork the repository and create a feature branch:
   - `git checkout -b feature/your-feature-name`
2. Make your changes in small, focused commits.
3. Run the relevant installs/builds locally:
   - `cd brave-sync-notes/client && npm install && npm run build`
   - `cd brave-sync-notes/server && npm install && node index.js` (for a quick smoke test)
4. Open a pull request with a clear description of the change and related issue(s).

## Code style

- Use Prettier/ESLint style defaults where applicable if added later.
- Keep functions small and focused.
- Prefer clear naming over short names.

## Commit messages

- Use descriptive commit messages.
- Optionally follow the conventional commits style (e.g. `feat:`, `fix:`, `docs:`).

## Security

- Do not commit secrets (API keys, passwords, tokens).
- If you discover a security issue, please report it privately instead of creating a public issue first.
