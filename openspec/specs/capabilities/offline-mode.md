# Capability: Offline Mode

> **Status:** Active
> **Created:** 2026-04-23
> **Last Updated:** 2026-04-23

## Overview

Offline-first support with operation queue, Progressive Web App (PWA) capabilities, and automatic sync when connectivity is restored. Enables users to continue working without network access.

## References

### Product Requirements
- [Requirement 4: Offline Support & PWA](../../specs/product/note-sync-system.md#requirement-4-offline-support--pwa)

### Technical Design
- [RFC 0002 §3: Offline Queue & PWA](../../specs/rfc/0002-comprehensive-refactor.md#phase-3-offline-queue--pwa)

### Tests
- [Property 4: Offline Queue Consistency](../../specs/testing/test-strategy.md#property-4-offline-queue-consistency)

## Boundaries

### In Scope
- Offline operation queue
- Automatic sync on reconnection
- Service Worker for PWA
- Offline indicator UI
- Conflict resolution for queued operations
- Local-first data persistence

### Out of Scope
- Full offline collaboration
- Background sync (browser limited)
- Push notifications when offline

## Dependencies

### Depends On
- **sync-core** - Receives sync events
- **conflict-resolution** - Resolves conflicts from queued ops
- **storage** - Local persistence layer

### Dependents
- None (leaf capability)

## Interface

### Client API
```typescript
interface OfflineModeAPI {
  // Queue management
  queueOperation(op: Operation): void;
  getPendingOperations(): PendingOperation[];
  clearQueue(): void;

  // Connection state
  isOnline(): boolean;
  onConnectionChange(callback: (online: boolean) => void): void;

  // Sync control
  forceSync(): Promise<SyncResult>;

  // PWA
  installPWA(): Promise<void>;
  isPWAInstalled(): boolean;
}
```

### Data Model
```typescript
interface PendingOperation {
  id: string;
  type: 'update' | 'create' | 'delete';
  notebookId: string;
  noteId?: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface OfflineState {
  isOnline: boolean;
  lastSyncTime: number;
  pendingCount: number;
  syncInProgress: boolean;
}
```

## Implementation Notes

### Operation Queue
1. Operations queued when offline
2. Queue persisted to IndexedDB
3. On reconnection, process queue in order
4. Retry failed operations (max 3 retries)
5. Resolve conflicts as they occur

### PWA Features
- Service Worker caches assets
- App manifest for installability
- Offline fallback pages
- Background sync (where supported)

### UI States
| State | Indicator |
|-------|-----------|
| Online & synced | Green dot |
| Online & syncing | Spinning icon |
| Offline | Orange dot |
| Offline & pending | Orange dot + count |

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 4 | Offline queue consistency | Req 4.1 |
| Property 14 | Queue replay order | Req 4.2 |
| Property 15 | No data loss on reconnect | Req 4.3 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial capability spec |
