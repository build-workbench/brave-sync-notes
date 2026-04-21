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

### Spec-Driven Development

This project follows **Spec-Driven Development (SDD)**. Before writing code:

1. **Review existing specs**: Check `/specs` directory for relevant product requirements, RFCs, and API definitions.
2. **Update specs first**: If introducing new features or changing interfaces, update the relevant spec documents first.
3. **Get spec approval**: Ensure spec changes are reviewed and approved before implementation.
4. **Implement to spec**: Write code that strictly follows the specifications.
5. **Test against specs**: Ensure tests verify all acceptance criteria defined in specs.

### Spec Directory Structure

```
specs/
├── product/            # Product requirements (What to build)
├── rfc/                # Technical design (How to build)
├── api/                # API interface definitions
├── db/                 # Database schema definitions
└── testing/            # Testing strategy and properties
```

### Development Steps

1. Fork the repository and create a feature branch:
   - `git checkout -b feature/your-feature-name`
2. Review and update specs in `/specs` directory if needed
3. Make your changes in small, focused commits.
4. Run the relevant validation locally:
   - `cd apps/web && npm ci && npm test -- --run && npm run build`
   - `cd apps/api && npm ci && npm test`
   - `cd apps/api && npm run test:property` (recommended when touching sync, persistence, or validation logic)
5. Add or update a record in `changelog/` for every submitted change set.
6. Open a pull request with a clear description of the change and related issue(s).

## Documentation expectations

- **Specs are the source of truth**: All product requirements, architecture decisions, and API definitions must be in `/specs`.
- **Keep docs in sync**: Update relevant specs when changing functionality. Code and specs must always match.
- **User documentation**: Place tutorials, guides, and how-to content in `/docs/setup` or `/docs/tutorials`.
- **Architecture docs**: High-level architecture goes in `/docs/architecture` (can link to detailed RFCs in `/specs/rfc`).
- **Changelog**: Update both `CHANGELOG.md` and `CHANGELOG.zh-CN.md` for user-facing changes.

## Creating New Specs

### Product Specs

Place in `/specs/product/`. Use this structure:

```markdown
# Feature Name - Product Requirements

> **Status:** Draft|Active|Deprecated
> **Created:** YYYY-MM-DD
> **Last Updated:** YYYY-MM-DD

## Overview

## Requirements

### Requirement N: Requirement Title

**User Story:** As a [user], I want [goal] so that [benefit].

#### Acceptance Criteria

1. WHEN [condition] THEN the System SHALL [behavior]
```

### RFCs (Technical Design)

Place in `/specs/rfc/`. Use naming convention: `NNNN-short-description.md`

```markdown
# RFC NNNN: Title

> **Status:** Draft|Active|Accepted|Deprecated|Rejected
> **Created:** YYYY-MM-DD
> **Last Updated:** YYYY-MM-DD
> **Supersedes:** Previous RFC (if any)

## Summary

## Motivation

## Architecture

## Components and Interfaces

## Data Models

## Correctness Properties

## Implementation Phases
```

## Code style

- Keep functions small and focused.
- Prefer clear naming over short names.
- Reuse existing test frameworks and project structure before introducing new tooling.
- Use JSDoc comments for function documentation.
- Follow ESLint configuration in project root.
- Use `async/await` for asynchronous operations.

## Commit messages

- Use descriptive commit messages.
- Optionally follow the conventional commits style (e.g. `feat:`, `fix:`, `docs:`).

## Security

- Do not commit secrets (API keys, passwords, tokens).
- If you discover a security issue, please report it privately instead of creating a public issue first.
