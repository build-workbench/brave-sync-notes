# Brave Sync Schema

This custom schema extends OpenSpec's `spec-driven` schema to accommodate the multi-format specifications used in the Note Sync Now project.

## Overview

The brave-sync schema supports:

1. **Multi-format specs** - YAML for API, DBML for Database, Markdown for requirements
2. **Capability-based organization** - Specs organized by functional capabilities
3. **Two-tier system** - Stable specs in `specs/`, change management in `openspec/`

## Schema Definition

```yaml
name: brave-sync
version: 1
description: Custom schema for Note Sync Now project
extends: spec-driven

project:
  name: Note Sync Now
  description: End-to-end encrypted note synchronization system

references:
  product: specs/product/
  rfc: specs/rfc/
  api: specs/api/
  db: specs/db/
  testing: specs/testing/

capabilities:
  sync-core:
    name: Core Synchronization
    description: Real-time note synchronization with WebSocket
    refs:
      - specs/product/note-sync-system.md#requirement-1
      - specs/rfc/0001-core-architecture.md
      - specs/api/websocket-api.yaml

  conflict-resolution:
    name: Conflict Detection & Resolution
    description: Three-way merge and manual resolution UI
    refs:
      - specs/product/note-sync-system.md#requirement-2
      - specs/rfc/0001-core-architecture.md#conflict-resolution
      - specs/testing/test-strategy.md#properties-3-4

  multi-notebook:
    name: Multi-Notebook Support
    description: Create and manage multiple notebooks
    refs:
      - specs/product/note-sync-system.md#requirement-3
      - specs/rfc/0002-comprehensive-refactor.md#phase-4

  offline-mode:
    name: Offline Mode & PWA
    description: Offline queue and Progressive Web App support
    refs:
      - specs/product/note-sync-system.md#requirement-4
      - specs/rfc/0002-comprehensive-refactor.md#phase-3

  version-history:
    name: Version Control
    description: Note version history and restoration
    refs:
      - specs/product/note-sync-system.md#requirement-5
      - specs/testing/test-strategy.md#properties-6-10

  encryption:
    name: End-to-End Encryption
    description: AES-256-GCM encryption with mnemonic recovery
    refs:
      - specs/rfc/0001-core-architecture.md#encryption
      - specs/testing/test-strategy.md#property-encryption

  storage:
    name: Multi-Layer Storage
    description: Redis/SQLite server storage, IndexedDB client storage
    refs:
      - specs/product/note-sync-system.md#requirement-1
      - specs/db/schema-v1.dbml

artifacts:
  proposal:
    generates: proposal.md
    description: What & Why of the change
    requires: []

  specs:
    generates: "specs/**/*.md"
    description: Delta specifications for the change
    requires:
      - proposal

  design:
    generates: design.md
    description: Technical design document
    requires:
      - proposal

  tasks:
    generates: tasks.md
    description: Implementation checklist
    requires:
      - specs
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
```

## Delta Spec Formats

### API Delta (`specs/api-delta.yaml`)

```yaml
base: specs/api/websocket-api.yaml
change_type: extend  # extend | modify | deprecate

additions:
  events:
    client:
      - name: new-event-name
        description: Event description
        payload:
          field: type
        response:
          field: type
    server:
      - name: server-event-name
        description: Event description
        payload:
          field: type

modifications:
  - event: existing-event
    changes:
      - field: payload.field
        action: add_value
        values: ["new-value"]
```

### Database Delta (`specs/db-delta.dbml`)

```dbml
// Delta for Database Schema
// Base: specs/db/schema-v1.dbml

// New tables
Table new_table {
  id varchar [pk]
  created_at timestamp
}

// New indexes
Table existing_table {
  indexes {
    (field1, field2) [name: "new_index"]
  }
}
```

## Workflow

```
/opsx:propose "feature-name"
    ↓
Create change in openspec/changes/feature-name/
    ├── proposal.md    (What & Why)
    ├── design.md      (How)
    ├── tasks.md       (Checklist)
    └── specs/         (Delta specs)
        ├── api-delta.yaml
        └── db-delta.dbml
    ↓
/opsx:apply
    ↓
Implement tasks, mark complete
    ↓
/opsx:archive
    ↓
Move to archive/, merge verified specs
```

## Related Documents

- [Capability Template](./capability.template.md)
- [RFC Template](./rfc.template.md)
- [Project AGENTS.md](../../AGENTS.md)
