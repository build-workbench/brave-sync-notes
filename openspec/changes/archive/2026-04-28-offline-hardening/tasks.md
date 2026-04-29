# Tasks: Offline Mode Hardening

## Phase 1: Service Worker Setup (2 tasks)

- [ ] **sw-setup** - Generate and register service worker with Workbox
- [ ] **asset-caching** - Configure cache strategy for app shell

## Phase 2: Offline Queue (3 tasks)

- [ ] **queue-storage** - Create IndexedDB table for offline queue
- [ ] **queue-management** - Queue failed updates, implement retry logic
- [ ] **queue-tests** - Test queuing and retry behavior

## Phase 3: Network Status UI (2 tasks)

- [ ] **status-indicator** - Add online/offline indicator to UI
- [ ] **sync-status** - Show sync progress and queue state

## Phase 4: Auto-Sync (2 tasks)

- [ ] **reconnect-handler** - Watch for online events and retry queue
- [ ] **sync-tests** - Test offline edits sync correctly when online

## Phase 5: Edge Cases (3 tasks)

- [ ] **sw-update** - Handle SW updates and cache invalidation
- [ ] **quota-handling** - Handle IndexedDB quota exceeded
- [ ] **integration-tests** - Full test suite for offline scenarios

## Phase 6: Finalization (1 task)

- [ ] **final-checks** - Performance and reliability verification
