# Design: Offline Mode Integration

## Context

The offline mode system provides queue-based operation storage when the network is unavailable. The OfflineQueue class and useOffline hook have been implemented, but the integration with the socket layer is incomplete.

### Current State
- `OfflineQueue` - Implemented with enqueue/dequeue operations
- `useOffline` hook - Created but not fully integrated
- `OfflineIndicator` component - Basic implementation exists
- Missing: Socket integration, conflict handling, property tests

### Constraints
- Must preserve operation order during offline period
- Must detect and resolve conflicts when syncing
- Must not lose data during reconnection
- UI must clearly indicate offline status

## Goals / Non-Goals

**Goals:**
- Automatically queue operations when offline
- Process queued operations on reconnection
- Handle conflicts from offline changes
- Show clear offline/online status
- Add comprehensive property tests

**Non-Goals:**
- Server-side offline handling (out of scope)
- Background sync (browser limitation)
- PWA installation prompt (separate feature)

## Decisions

### 1. Offline Detection Strategy

**Decision:** Use browser's navigator.onLine + socket connection status

**Rationale:**
- navigator.onLine is immediate but can be unreliable
- Socket status is accurate for our use case
- Combined approach provides best UX

```javascript
const isOffline = !navigator.onLine || socketStatus === 'disconnected';
```

### 2. Operation Queue Integration

**Decision:** Wrap socket emit calls with offline detection

**Rationale:**
- Transparent to existing code
- Automatic fallback when offline
- No API changes required

```javascript
// In useSocket
const pushUpdate = (content) => {
  if (isOnline && socket.connected) {
    socket.emit('push-update', content);
  } else {
    offlineQueue.enqueue({
      type: 'update',
      data: content,
      timestamp: Date.now(),
    });
  }
};
```

### 3. Reconnection Sync Strategy

**Decision:** Process queue in order with conflict detection

**Rationale:**
- Preserves user intent
- Allows conflict resolution
- Maintains data integrity

**Reconnection Flow:**
1. Socket reconnects
2. Request current server state
3. Process queued operations in order
4. Detect conflicts on each operation
5. Resolve conflicts or queue for user review

### 4. Queue Persistence

**Decision:** Persist queue to IndexedDB via StorageManager

**Rationale:**
- Survives page refresh
- Uses existing storage layer
- No new dependencies

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Queue grows large during long offline period | Limit queue size, warn user |
| Conflicts cause data loss | Three-way merge, user resolution UI |
| Reconnection flood server | Rate limit queue processing |
| IndexedDB unavailable | Memory queue fallback |

## Open Questions

None - all technical decisions have been made based on existing RFC 0002 specifications.
