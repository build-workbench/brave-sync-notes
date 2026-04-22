# Proposal: Complete Storage Integration

## Why

The storage system (StorageManager, useStorage hook) has been implemented but is not fully integrated into the main application flow. Several Phase 2 tasks from RFC 0002 remain incomplete: property tests for storage operations, App.jsx initialization, auto-save feature, and data recovery. Completing this integration is essential before proceeding to Phase 3 (Offline Mode) and Phase 4 (Multi-Note Support).

## What Changes

### Core Changes
- Initialize storage in App.jsx on application startup
- Implement auto-save feature with debouncing (300ms default)
- Implement data recovery feature for corrupted storage
- Add property tests for storage round-trip consistency
- Add property tests for history version limit

### Breaking Changes
None - all changes are additive.

## Capabilities

### New Capabilities
None - this change implements existing capabilities defined in the storage capability spec.

### Modified Capabilities

- **storage**: Adding initialization flow, auto-save, and recovery features
  - New: Auto-save with configurable debounce
  - New: Data recovery from corrupted IndexedDB
  - New: Property tests for storage operations

## Impact

### Affected Code
| File | Change |
|------|--------|
| `apps/web/src/App.jsx` | Add storage initialization on mount |
| `apps/web/src/store/useStore.js` | Integrate auto-save trigger |
| `apps/web/src/hooks/useStorage.js` | Add recovery methods |
| `apps/web/src/utils/storage/StorageManager.js` | Add recovery utilities |
| `apps/api/src/persistence/__tests__/` | New property test files |

### APIs
No API changes - all changes are client-side only.

### Dependencies
- Existing: StorageManager, useStorage hook, Zustand store
- No new dependencies

### Tests
- Property tests for storage round-trip (Property 1)
- Property tests for history version limit (Property 9)
- Unit tests for auto-save feature
- Unit tests for data recovery feature

## Related Specs

- [RFC 0002: Comprehensive Refactor](../../specs/rfc/0002-comprehensive-refactor.md) - Phase 2
- [Testing Strategy](../../specs/testing/test-strategy.md) - Properties 1, 9, 12
- [Storage Capability](../openspec/specs/capabilities/sync-core.md) - Storage integration
