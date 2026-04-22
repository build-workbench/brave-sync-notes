# Proposal: Offline Mode Integration

## Why

The OfflineQueue class and useOffline hook have been implemented but are not fully integrated into the main application flow. Phase 3 of RFC 0002 requires completing the offline mode support to enable seamless offline editing with automatic sync when connectivity is restored. This is critical for users who need to work in environments with unreliable network connections.

## What Changes

### Core Changes
- Integrate offline queue with useSocket for automatic enqueue when offline
- Process queued operations on reconnection
- Add offline status indicator in UI
- Handle conflicts from offline changes
- Add property tests for offline queue order preservation

### Breaking Changes
None - all changes are additive.

## Capabilities

### New Capabilities
None - this change implements existing capabilities defined in the offline-mode capability spec.

### Modified Capabilities

- **offline-mode**: Complete integration of offline queue with socket layer
  - New: Automatic operation enqueue when offline
  - New: Queue processing on reconnection
  - New: Conflict handling for offline changes
  - New: Offline indicator UI

## Impact

### Affected Code
| File | Change |
|------|--------|
| `apps/web/src/hooks/useSocket.js` | Integrate offline queue |
| `apps/web/src/hooks/useOffline.js` | Complete implementation |
| `apps/web/src/components/OfflineIndicator/OfflineIndicator.jsx` | Enhanced UI |
| `apps/web/src/App.jsx` | Offline status handling |
| `apps/web/src/utils/offline/__tests__/` | New property test files |

### APIs
No API changes - all changes are client-side only.

### Dependencies
- Existing: OfflineQueue, useOffline hook, useSocket hook
- No new dependencies

### Tests
- Property tests for offline queue order (Property 5)
- Unit tests for queue processing
- Integration tests for reconnection sync

## Related Specs

- [RFC 0002: Comprehensive Refactor](../../specs/rfc/0002-comprehensive-refactor.md) - Phase 3
- [Testing Strategy](../../specs/testing/test-strategy.md) - Properties 5, 14, 15
- [Offline Mode Capability](../openspec/specs/capabilities/offline-mode.md)
