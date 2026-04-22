# Capability: Core Synchronization

> **Status:** Active
> **Created:** 2026-04-23
> **Last Updated:** 2026-04-23

## Overview

Real-time note synchronization using WebSocket and Socket.IO. Provides the core sync engine that enables multi-device note editing with automatic conflict detection.

## References

### Product Requirements
- [Requirement 1: Data Persistence & Reliability](../../specs/product/note-sync-system.md#requirement-1-data-persistence--reliability)
- [Requirement 6: Real-Time Synchronization](../../specs/product/note-sync-system.md#requirement-6-real-time-synchronization)

### Technical Design
- [RFC 0001: Core Architecture](../../specs/rfc/0001-core-architecture.md) - Full system design
- [RFC 0001 §1: Persistence Module](../../specs/rfc/0001-core-architecture.md#persistence-module)
- [RFC 0001 §2: Sync Engine](../../specs/rfc/0001-core-architecture.md#sync-engine)

### API
- [WebSocket Events](../../specs/api/websocket-api.yaml) - All sync events
  - `join-chain` - Join a sync room
  - `push-update` - Push content changes
  - `sync-update` - Receive sync updates
  - `request-sync` - Request full sync

### Database
- [Rooms Table](../../specs/db/schema-v1.dbml) - Server-side room storage
- [Operations Table](../../specs/db/schema-v1.dbml) - Operation log

### Tests
- [Property 1: Storage Round-Trip Consistency](../../specs/testing/test-strategy.md#property-1-storage-round-trip-consistency)
- [Property 2: Version Monotonicity](../../specs/testing/test-strategy.md#property-2-version-monotonicity)

## Boundaries

### In Scope
- WebSocket connection management
- Room-based synchronization
- Content chunking for large notes (>50KB)
- Automatic reconnection with sync recovery
- Server-side persistence (Redis/SQLite)

### Out of Scope
- Conflict resolution (see `conflict-resolution` capability)
- Offline queue management (see `offline-mode` capability)
- Encryption (see `encryption` capability)

## Dependencies

### Depends On
- **encryption** - Content is encrypted before sync
- **storage** - Server and client storage layers

### Dependents
- **conflict-resolution** - Detects conflicts during sync
- **offline-mode** - Uses sync engine when online
- **multi-notebook** - Multiple sync chains per notebook

## Interface

### Client API
```typescript
interface SyncAPI {
  // Join a sync chain
  joinChain(mnemonic: string, deviceName: string): Promise<JoinResult>;

  // Push content update
  pushUpdate(content: EncryptedContent): Promise<void>;

  // Request full sync
  requestSync(sinceVersion?: number): Promise<SyncResult>;

  // Leave sync chain
  leaveChain(): void;

  // Event handlers
  onSyncUpdate(callback: (update: SyncUpdate) => void): void;
  onConnectionChange(callback: (connected: boolean) => void): void;
}
```

### Server API
```typescript
interface SyncHandler {
  handleJoinChain(socket: Socket, payload: JoinPayload): Promise<void>;
  handlePushUpdate(socket: Socket, payload: UpdatePayload): Promise<void>;
  handleRequestSync(socket: Socket, payload: SyncPayload): Promise<void>;
  handleLeaveChain(socket: Socket, payload: LeavePayload): Promise<void>;
}
```

## Implementation Notes

### Key Considerations
- **Chunking**: Content >50KB is split into chunks for reliable transfer
- **Debouncing**: Client debounces updates (300ms) before pushing
- **Version tracking**: Each update increments version number
- **TTL**: Rooms expire after 7 days of inactivity

### Security
- Server never sees plaintext content
- Room ID derived from mnemonic hash
- Device authentication via roomId + deviceId

### Performance
- Redis for hot data, SQLite fallback
- In-memory cache for active connections
- Rate limiting per room (100 updates/min)

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 1 | Storage round-trip consistency | Req 1.3, 1.4 |
| Property 2 | Version monotonicity | Req 6.2 |
| Property 11 | Room isolation | Req 1.6 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial capability spec |
