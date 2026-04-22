# Capability: [Name]

> **Status:** Draft | Active | Deprecated
> **Created:** YYYY-MM-DD
> **Last Updated:** YYYY-MM-DD

## Overview

Brief description of what this capability provides and its purpose in the system.

## References

### Product Requirements
- [Requirement X.X](../../specs/product/note-sync-system.md#requirement-x) - Brief description

### Technical Design
- [RFC XXXX Section](../../specs/rfc/XXXX-name.md#section) - Brief description

### API
- [Event Name](../../specs/api/websocket-api.yaml#event-name) - Brief description

### Database
- [Table Name](../../specs/db/schema-v1.dbml#table-name) - Brief description

### Tests
- [Property N](../../specs/testing/test-strategy.md#property-n) - Brief description

## Boundaries

### In Scope
- What this capability includes
- Features and functions provided

### Out of Scope
- What this capability does NOT include
- Related but separate capabilities

## Dependencies

### Depends On
- Other capabilities this one requires

### Dependents
- Capabilities that depend on this one

## Interface

### Client API
```typescript
// TypeScript interface for client-side usage
interface CapabilityAPI {
  method(param: Type): ReturnType;
}
```

### Server API
```typescript
// TypeScript interface for server-side handlers
interface CapabilityHandler {
  handleEvent(event: Event): Promise<Result>;
}
```

## Implementation Notes

Key considerations for implementing this capability:
- Security considerations
- Performance considerations
- Edge cases

## Test Properties

Properties that verify this capability:

| Property | Description | Validates |
|----------|-------------|-----------|
| Property N | For any X, the system SHALL Y | Req X.X |

---

## Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial specification |
