# Tasks: Yjs Collaboration

## Phase 1: Y.Text Binding (4 tasks)

- [ ] **yjs-setup** - Install yjs and y-indexeddb; initialize Y.Doc on app load
- [ ] **ytext-binding** - Create Y.Text binding layer for CodeMirror editor
- [ ] **indexeddb-provider** - Wire Y.Doc persistence to IndexedDB
- [ ] **binding-tests** - Test Y.Text edits sync and persist

## Phase 2: Socket.IO Integration (4 tasks)

- [ ] **update-serialization** - Serialize Yjs updates to bytes for transport
- [ ] **push-yjs-updates** - Wire Yjs changes to existing `push-update` event
- [ ] **receive-yjs-updates** - Apply incoming Yjs updates to Y.Doc via `sync-update`
- [ ] **integration-tests** - Test two-client concurrent edits resolve correctly

## Phase 3: Offline & Recovery (3 tasks)

- [ ] **offline-restore** - Load Y.Doc from IndexedDB on app startup
- [ ] **sync-recovery** - Request missing updates after joining room
- [ ] **offline-tests** - Test offline edits + online recovery

## Phase 4: Cleanup & Optimization (2 tasks)

- [ ] **doc-cleanup** - Remove Y.Doc from IndexedDB when note is deleted
- [ ] **final-tests** - Full integration test suite; performance check
