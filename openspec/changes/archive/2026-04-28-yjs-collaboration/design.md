# Design: Yjs Collaboration

## Architecture

```
Editor (CodeMirror)
    ↓
Y.Text Binding
    ↓
Yjs Provider (custom Socket.IO adapter)
    ↓
Socket.IO room (per notebook)
    ↓
Server (broadcast Yjs updates)
    ↓
Other clients (apply via CRDT)
```

## Key Decisions

### 1. Y.Text Binding Strategy
- **Decision**: Bind Yjs Y.Text directly to CodeMirror state
- **Why**: Automatic sync without manual event handling
- **Trade-off**: Requires custom binding layer (not built-in to CodeMirror 6)

### 2. Persistence Layer
- **Decision**: Use y-indexeddb for local persistence
- **Why**: Survived client crashes, enable offline collab
- **Implementation**: Initialize Yjs doc from IndexedDB on app load

### 3. Socket.IO Integration
- **Decision**: Yjs updates go through existing `push-update` event
- **Why**: Reuses encryption, rate limiting, room management
- **Payload**: Encrypt Yjs update bytes as before

### 4. Conflict Resolution
- **Decision**: CRDT handles character-level conflicts; keep manual UI for document-level conflicts
- **Why**: CRDT can't resolve "which notebook version is correct" across devices
- **Implementation**: Preserve existing conflict detection logic

### 5. Offline Support
- **Decision**: Yjs doc syncs offline locally; when online, reapply unsent updates
- **Why**: IndexedDB is always available; Socket.IO sync is opportunistic
- **Implementation**: No changes to offline queue; just use Yjs state as source

## Implementation Phases

### Phase 1: Y.Text Binding
1. Initialize Y.Doc on app load (load from IndexedDB if exists)
2. Create Y.Text for each note
3. Bind Y.Text to CodeMirror editor
4. Test: Note edits sync via Yjs, persist to IndexedDB

### Phase 2: Socket.IO Integration
1. Serialize Yjs updates on change
2. Push updates via existing `push-update` event
3. Receive updates from other clients via `sync-update`
4. Apply received updates to Y.Doc (triggers editor binding)

### Phase 3: Offline & Recovery
1. On app load: restore Y.Doc from IndexedDB
2. On sync join: request missing updates from server
3. On conflict: merge local + server versions via Yjs

## Test Coverage

- Y.Text binding correctness (edits reflected in CodeMirror)
- Offline edits merged correctly when going online
- Concurrent edits from two clients resolve correctly
- Yjs updates serialized/deserialized correctly
- IndexedDB persistence survives app reload

## Open Questions

- Should we track per-character attribution (who typed what)? → Defer to future awareness feature
- How to handle large notes (>1MB Yjs doc)? → Implement chunking if needed
- Should deleted notes' Y.Docs be cleaned up? → Yes, implement cleanup on delete
