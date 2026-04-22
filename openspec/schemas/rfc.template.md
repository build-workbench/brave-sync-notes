# RFC: [NNNN] - [Title]

> **Status:** Draft | Active | Accepted | Deprecated | Rejected
> **Created:** YYYY-MM-DD
> **Last Updated:** YYYY-MM-DD
> **Author:** [Name]

## Summary

One paragraph summary of what this RFC proposes and why.

## Motivation

Why is this change needed? What problem does it solve?

## Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Diagram                         │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### Component 1

Description of component responsibilities and interfaces.

```typescript
interface Component1 {
  method(): ReturnType;
}
```

#### Component 2

Description of component responsibilities and interfaces.

### Data Model

```typescript
interface DataModel {
  id: string;
  field: Type;
  createdAt: number;
  updatedAt: number;
}
```

### API Changes

New events or modifications to existing API:

| Event | Direction | Description |
|-------|-----------|-------------|
| `event-name` | Client → Server | Description |

### Database Changes

New tables or schema modifications:

```dbml
Table new_table {
  id varchar [pk]
  field type
}
```

## Correctness Properties

Properties that verify this RFC's implementation:

### Property 1: [Name]

*For any* valid input, the system SHALL produce expected output.

**Validates:** Requirement X.X

### Property 2: [Name]

*For any* edge case, the system SHALL handle gracefully.

**Validates:** Requirement X.X

## Implementation Phases

### Phase 1: [Name]

- [ ] Task 1.1
- [ ] Task 1.2

### Phase 2: [Name]

- [ ] Task 2.1
- [ ] Task 2.2

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Risk description | How to mitigate |

## Alternatives Considered

### Alternative 1: [Name]

Why this approach was not chosen.

### Alternative 2: [Name]

Why this approach was not chosen.

## Related Documents

- [Product Requirements](../../specs/product/note-sync-system.md)
- [API Specification](../../specs/api/websocket-api.yaml)
- [Database Schema](../../specs/db/schema-v1.dbml)

---

## Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | RFC created |
