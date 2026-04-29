# Design: Offline Mode Hardening

## Architecture

```
App Shell
    ↓ (Service Worker cache)
    ↓
Offline Queue
    ↓ (Background Sync)
    ↓
Socket.IO / REST API
```

## Key Decisions

### 1. Service Worker Strategy
- **Decision**: Workbox for SW generation + caching
- **Why**: Production-ready, handles cache versioning
- **Cache Strategy**: 
  - App shell: cache-first (index.html, CSS, JS, fonts)
  - API: network-first with fallback to cache

### 2. Offline Queue
- **Decision**: Store failed updates in IndexedDB with retry logic
- **Why**: Survives app restarts, auto-retry on reconnect
- **Payload**: Yjs update bytes, Socket.IO event name, timestamp
- **Retry**: Exponential backoff (1s, 2s, 4s, ..., max 60s)

### 3. Network Detection
- **Decision**: Use `navigator.onLine` + Socket.IO connection state
- **Why**: Dual detection catches flaky connections
- **UI**: Show "Offline" badge when either indicator says offline

### 4. Background Sync Triggers
- **Decision**: Manual retry logic (not Web Background Sync API due to browser support)
- **Why**: More reliable cross-browser; simpler implementation
- **Implementation**: Retry queue on app focus, periodic check (30s interval)

### 5. Conflict Handling
- **Decision**: Yjs CRDT resolves conflicts automatically
- **Why**: No manual conflict detection needed for offline+online merge
- **Fallback**: If merge fails, show manual resolution UI

## Implementation Phases

### Phase 1: Service Worker Setup
1. Generate SW with Workbox
2. Cache app shell on SW install
3. Implement cache-first strategy for assets
4. Test: App loads offline (with SW pre-cached)

### Phase 2: Offline Queue
1. Create offline queue (IndexedDB table)
2. Queue failed Socket.IO events
3. Implement retry logic with exponential backoff
4. Test: Offline edits are queued, then synced when online

### Phase 3: Network Status UI
1. Add online/offline indicator to UI
2. Show sync status (queued, syncing, done)
3. Disable send button when offline (optional)
4. Test: UI shows correct status as network toggles

### Phase 4: Auto-Sync on Reconnect
1. Watch for online event
2. Start retry loop for queued updates
3. Show sync progress
4. Test: Offline edits sync automatically when reconnected

### Phase 5: Edge Cases
1. Handle SW update (cache invalidation)
2. Handle IndexedDB quota exceeded
3. Handle stale cache (version mismatch)
4. Test: Complex scenarios (offline, SW update, reconnect)

## Test Coverage

- Service Worker installs and caches correctly
- App loads with pre-cached SW
- Failed updates are queued in IndexedDB
- Queue is retried on reconnect
- Yjs conflicts merge correctly
- Network status UI updates correctly
- Offline edits + online sync produce correct result

## Performance Targets

- App shell load time offline: <1s
- Queue retry latency: <1s after reconnect
- IndexedDB queue size: <50MB
