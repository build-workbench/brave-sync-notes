# Documentation

This directory contains user guides, tutorials, and supplementary documentation for Note Sync Now.

## Structure

```
docs/
├── setup/              # Environment setup and installation guides
├── tutorials/          # User tutorials and how-to guides
├── architecture/       # High-level architecture documentation
├── assets/             # Images, diagrams, and static resources
├── en/                 # English documentation (legacy)
├── zh-CN/              # Chinese documentation (legacy)
└── api/                # API reference documentation
```

## For New Documentation

- **Setup guides**: Add to `docs/setup/`
- **User tutorials**: Add to `docs/tutorials/`
- **Architecture diagrams**: Add to `docs/assets/`
- **High-level architecture**: Add to `docs/architecture/`

## For Technical Specifications

Technical specifications (product requirements, RFCs, API definitions, database schemas) are maintained in the `/specs` directory at the project root:

- `/specs/product/` - Product requirements
- `/specs/rfc/` - Technical design documents
- `/specs/api/` - API specifications
- `/specs/db/` - Database schemas
- `/specs/testing/` - Testing strategy

See [AGENTS.md](https://github.com/LessUp/brave-sync-notes/blob/main/AGENTS.md) for the spec-driven development workflow.
