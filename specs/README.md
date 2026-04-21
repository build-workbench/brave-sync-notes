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

| Document | Status | Description |
|----------|--------|-------------|
| [Note Sync System](./product/note-sync-system.md) | Active | Core product requirements, user stories, and acceptance criteria |

### Technical Design (RFCs)

| RFC | Status | Description |
|-----|--------|-------------|
| [RFC 0001: Core Architecture](./rfc/0001-core-architecture.md) | Accepted | System architecture, data flow, and component design |
| [RFC 0002: Comprehensive Refactor](./rfc/0002-comprehensive-refactor.md) | Active | Integration of storage, conflict management, offline queue, and multi-note support |

### API Specifications

| Document | Status | Description |
|----------|--------|-------------|
| [WebSocket API](./api/websocket-api.yaml) | Active | Socket.IO events and payloads for real-time synchronization |

### Database Schema

| Document | Status | Description |
|----------|--------|-------------|
| [Schema v1](./db/schema-v1.dbml) | Active | Server-side persistence layer data model |

### Testing

| Document | Status | Description |
|----------|--------|-------------|
| [Testing Strategy](./testing/test-strategy.md) | Active | Test frameworks, coverage targets, and correctness properties |

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
   - RFCs: `NNNN-short-description.md` (e.g., `0003-pwa-support.md`)
   - API specs: Descriptive names with `.yaml` or `.md` extension
   - DB specs: `schema-version.dbml`

## RFC Naming Convention

RFCs are numbered sequentially and should follow this format:

```
NNNN-short-description.md
```

Where:
- `NNNN` is a 4-digit zero-padded number (0001, 0002, etc.)
- `short-description` is a kebab-case summary of the RFC topic

## Spec Statuses

| Status | Description |
|--------|-------------|
| Draft | Work in progress, not yet approved |
| Active | Approved and currently in effect |
| Accepted | Approved and implemented |
| Deprecated | Superseded by newer specs, kept for reference |
| Rejected | Not approved, kept for historical record |

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    specs/ (Single Source of Truth)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  product/   │───►│    rfc/     │───►│    api/     │     │
│  │  (What)     │    │  (How)      │    │ (Interface) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         │                  ▼                  │             │
│         │           ┌─────────────┐           │             │
│         └──────────►│    db/      │◄──────────┘             │
│                     │  (Storage)  │                         │
│                     └─────────────┘                         │
│                           │                                 │
│                           ▼                                 │
│                     ┌─────────────┐                         │
│                     │  testing/   │                         │
│                     │ (Verify)    │                         │
│                     └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Links

- [AGENTS.md](../AGENTS.md) - AI Agent workflow configuration
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/](../docs/) - User and developer documentation
