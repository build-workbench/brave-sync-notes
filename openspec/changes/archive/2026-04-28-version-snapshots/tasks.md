# Tasks: Version Snapshots

## Phase 1: Snapshot Storage (2 tasks)

- [ ] **snapshot-schema** - Create IndexedDB table for snapshots
- [ ] **snapshot-save** - Implement save and retention cleanup logic

## Phase 2: Auto-Save (1 task)

- [ ] **autosave-close** - Hook window.beforeunload to save snapshot

## Phase 3: Version Browser (2 tasks)

- [ ] **history-component** - Create VersionHistory UI component
- [ ] **version-list** - Implement list display with timestamps and sizes

## Phase 4: Restore Mechanism (2 tasks)

- [ ] **restore-function** - Implement restore logic (replace Y.Doc)
- [ ] **restore-ui** - Implement restore button and confirmation dialog

## Phase 5: Manual Snapshots (2 tasks)

- [ ] **save-version-button** - Add manual save button to UI
- [ ] **snapshot-description** - Allow optional descriptions for manual snapshots

## Phase 6: Testing & Finalization (3 tasks)

- [ ] **snapshot-tests** - Test all snapshot CRUD operations
- [ ] **restore-tests** - Test restore correctness
- [ ] **integration-tests** - Full version history workflow
