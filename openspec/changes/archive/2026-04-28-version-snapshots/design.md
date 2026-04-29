# Design: Version Snapshots

## Architecture

```
Note Edit
    ↓
Yjs State
    ↓ (on trigger: save, close, manual)
    ↓
Snapshot Storage (IndexedDB)
    ↓ (diff compression)
    ↓
Version Browser UI
```

## Key Decisions

### 1. Snapshot Triggers
- **Decision**: Automatic on app close, manual restore button
- **Why**: No user action needed for basic protection, manual for explicit saves
- **Future**: Add auto-save on idle (1min) if needed

### 2. Storage Format
- **Decision**: Store full Yjs state (not diffs)
- **Why**: Simpler, Yjs state is already efficient (CRDT ops are compact)
- **Trade-off**: More storage, but IndexedDB has 50MB+ quota
- **Optimization**: Compress with gzip if needed

### 3. Retention Policy
- **Decision**: Keep 50 snapshots per note, delete oldest when limit exceeded
- **Why**: Covers ~1 week at one snapshot per day
- **Future**: Configurable retention or cloud archive

### 4. Restore Mechanism
- **Decision**: Restore full Y.Doc to selected snapshot
- **Why**: Atomic, consistent, no merge logic needed
- **Trade-off**: Loses edits made after snapshot
- **UX**: Show warning "This will discard edits since version X"

### 5. Version Metadata
- **Decision**: Store timestamp, approximate size, optional description
- **Why**: Helps users identify correct version
- **Implementation**: Automatic fields only; manual descriptions in future

## Implementation Phases

### Phase 1: Snapshot Storage
1. Create IndexedDB table for snapshots (noteId, timestamp, yState, size)
2. Implement save snapshot function
3. Implement retention cleanup (keep 50 most recent)
4. Test: Snapshots are saved and cleaned up correctly

### Phase 2: Auto-Save on Close
1. Hook window.beforeunload to save snapshot
2. Also save on regular app exit (if possible)
3. Test: Snapshot is created when app closes

### Phase 3: Version Browser UI
1. Create VersionHistory component
2. Show list of snapshots with timestamps and sizes
3. Implement restore button
4. Test: UI shows versions and restore button works

### Phase 4: Restore Mechanism
1. Implement restore function (replace Y.Doc)
2. Show confirmation dialog before restore
3. Update editor after restore
4. Test: Restoring snapshot works correctly

### Phase 5: Manual Snapshot Trigger
1. Add "Save Version" button to UI
2. Allow optional description
3. Save snapshot with description in metadata
4. Test: Manual snapshots are saved with description

### Phase 6: Finalization
1. Performance testing (large snapshots, many restores)
2. IndexedDB quota monitoring
3. Error handling for quota exceeded
4. Test: Full version history workflow

## Test Coverage

- Snapshots are created and stored correctly
- Snapshots are cleaned up (keep 50 max)
- Restore replaces Y.Doc correctly
- Version browser shows correct list
- Restore confirmation works
- Manual snapshots save with descriptions
- App close triggers auto-save
- Metadata (timestamp, size) recorded correctly

## Performance Targets

- Snapshot save time: <100ms
- Snapshot restore time: <100ms
- Version list load time: <50ms
- IndexedDB storage: <100MB for 1 year of history
