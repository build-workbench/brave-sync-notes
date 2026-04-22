# OpenSpec Delta Specs

This directory contains **delta specifications** - incremental changes to existing specs during active development.

## Purpose

Delta specs capture changes being made during a change proposal:

- **Not full specs** - Only the new/modified parts
- **Working documents** - May change during implementation
- **Merged on archive** - Verified changes sync to stable specs

## Directory Structure

```
openspec/specs/
├── capabilities/     # Capability-specific specs
│   ├── sync-core.md
│   ├── conflict-resolution.md
│   ├── multi-notebook.md
│   ├── offline-mode.md
│   └── version-history.md
├── api/              # API delta specs (YAML patches)
└── db/               # Database delta specs (DBML patches)
```

## Delta Spec Formats

### Capability Spec

References existing specs in `specs/` and defines new requirements:

```markdown
# Capability: [Name]

## References
- [Product Req](../../specs/product/note-sync-system.md#requirement-x)

## New Requirements
### Requirement: [Name]
The system SHALL [behavior].

#### Scenario: [Name]
- WHEN [condition]
- THEN [expected outcome]
```

### API Delta (`api/api-delta.yaml`)

```yaml
base: specs/api/websocket-api.yaml
change_type: extend

additions:
  events:
    client:
      - name: new-event
        payload: { field: type }
```

### DB Delta (`db/db-delta.dbml`)

```dbml
// Base: specs/db/schema-v1.dbml
Table new_table { ... }
```

## Workflow

1. **Create** - `/opsx:propose` creates delta specs in `changes/<name>/specs/`
2. **Modify** - Update during implementation as design evolves
3. **Verify** - `/opsx:apply` implements and tests
4. **Merge** - `/opsx:archive` syncs verified changes

## Relationship to `specs/`

| Directory | Purpose | Status |
|-----------|---------|--------|
| `specs/` | Stable, approved specs | Single Source of Truth |
| `openspec/specs/` | Delta specs from active changes | Working drafts |
