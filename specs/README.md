# Specifications - Note Sync Now

This directory contains all specification documents that serve as the **Single Source of Truth** for the Note Sync Now project.

## Directory Structure

```
specs/
├── product/            # Product requirements and feature definitions
├── rfc/                # Technical design documents (RFCs)
├── api/                # API interface definitions
├── db/                 # Database schema definitions
└── testing/            # Testing strategy and correctness properties
```

## Active Specifications

### Product Requirements

- [Note Sync System](./product/note-sync-system.md) - Core product requirements, user stories, and acceptance criteria

### Technical Design (RFCs)

- [RFC 0001: Core Architecture](./rfc/0001-core-architecture.md) - System architecture, data flow, and component design

### API Specifications

- [WebSocket API](./api/websocket-api.yaml) - Socket.IO events and payloads for real-time synchronization

### Database Schema

- [Schema v1](./db/schema-v1.dbml) - Server-side persistence layer data model

### Testing

- [Testing Strategy](./testing/test-strategy.md) - Test frameworks, coverage targets, and correctness properties

## Workflow

This project follows **Spec-Driven Development (SDD)**:

1. **Review specs** before writing code
2. **Update specs first** when introducing new features or changing interfaces
3. **Implement to spec** - code must strictly follow specifications
4. **Test against specs** - verify all acceptance criteria

See [AGENTS.md](../AGENTS.md) for detailed workflow instructions.

## Adding New Specifications

When creating new specs:

1. Use Markdown format with clear headings and structure
2. Include status (Draft/Active/Deprecated) and dates
3. Link to related documents
4. Use tables, code blocks, and diagrams where helpful
5. Follow naming conventions:
   - Product specs: `feature-name.md`
   - RFCs: `NNNN-short-description.md` (e.g., `0002-oauth2-implementation.md`)
   - API specs: Descriptive names with `.yaml` or `.md` extension
   - DB specs: `schema-version.dbml`

## Archive

Historical specification documents from the old `.kiro` directory have been migrated to this structure. The original files in `.kiro/specs/` are kept for reference but should not be used as the source of truth.
