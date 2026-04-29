# Documentation

This directory contains the VitePress-powered documentation site for Note Sync Now.

## Structure

```
docs/
├── .vitepress/         # VitePress configuration
├── assets/             # Images, diagrams, and static resources
├── public/             # Public static files (logos, screenshots)
├── en/                 # English documentation
├── zh-CN/              # Chinese documentation
├── api/                # API reference documentation
└── changelog/          # Version history archive
```

## Development

```bash
# Start VitePress dev server
cd docs && npm run dev

# Build documentation
cd docs && npm run build
```

## For Technical Specifications

Technical specifications are maintained in the `/specs` directory:

- `/specs/product/` - Product requirements
- `/specs/rfc/` - Technical design documents (RFCs)
- `/specs/api/` - API specifications
- `/specs/db/` - Database schemas
- `/specs/testing/` - Testing strategy

See [AGENTS.md](https://github.com/LessUp/brave-sync-notes/blob/main/AGENTS.md) for the spec-driven development workflow.
