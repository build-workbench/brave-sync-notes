# Design: Complete Storage Integration

## Context

The storage system provides client-side persistence using IndexedDB with LocalStorage fallback. The StorageManager class and useStorage hook have been implemented, but the integration into the application lifecycle is incomplete.

### Current State
- `StorageManager` - Fully implemented with IndexedDB/LocalStorage support
- `useStorage` hook - Created but not used in App.jsx
- Store integration - Basic integration exists
- Missing: Initialization flow, auto-save, recovery, property tests

### Constraints
- Must maintain backward compatibility with existing stored data
- Must not block application startup if storage initialization fails
- Auto-save must not interfere with user typing experience

## Goals / Non-Goals

**Goals:**
- Initialize storage on application mount
- Implement debounced auto-save for note content
- Provide data recovery mechanism for corrupted storage
- Add comprehensive property tests

**Non-Goals:**
- Server-side storage changes (out of scope)
- Offline queue integration (Phase 3)
- Multi-note support (Phase 4)

## Decisions

### 1. Storage Initialization Strategy

**Decision:** Initialize storage asynchronously in App.jsx with loading state

**Rationale:**
- User sees loading indicator during initialization
- Graceful degradation if IndexedDB is unavailable
- Clear error state if all storage fails

```javascript
// App.jsx initialization flow
useEffect(() => {
  const initStorage = async () => {
    try {
      await storage.initialize();
      setStorageReady(true);
    } catch (error) {
      setStorageError(error);
    }
  };
  initStorage();
}, []);
```

### 2. Auto-Save Implementation

**Decision:** Use Zustand middleware with debounced save trigger

**Rationale:**
- Keeps save logic close to state changes
- Configurable debounce interval (default 300ms)
- Can be disabled for performance-critical scenarios

```javascript
// Auto-save middleware pattern
const autoSaveMiddleware = (config) => (set, get, api) => {
  const debouncedSave = debounce(async (state) => {
    if (state.activeNoteId && state.storageReady) {
      await storage.saveNote(state.activeNotebookId, {
        id: state.activeNoteId,
        content: state.content,
        updatedAt: Date.now(),
      });
    }
  }, 300);

  return config(
    (...args) => {
      set(...args);
      debouncedSave(get());
    },
    get,
    api
  );
};
```

### 3. Data Recovery Approach

**Decision:** Implement recovery utilities in StorageManager

**Rationale:**
- Can recover partial data from corrupted IndexedDB
- Falls back to LocalStorage backup
- Exports recoverable data as JSON

**Recovery Flow:**
1. Detect IndexedDB corruption (open fails)
2. Attempt to read existing data
3. Export to JSON file
4. Clear corrupted store
5. Re-import data

### 4. Property Test Strategy

**Decision:** Use fast-check for storage property tests

**Properties to Test:**
- **Property 1:** Storage round-trip consistency
- **Property 9:** History version limit (50 max)
- **Property 12:** Data validation rejects invalid input

```javascript
// Example property test
fc.assert(
  fc.property(
    fc.record({
      id: fc.string(),
      content: fc.string(),
      title: fc.string(),
      updatedAt: fc.integer(),
    }),
    async (note) => {
      await storage.saveNote('notebook-1', note);
      const retrieved = await storage.getNote('notebook-1', note.id);
      return retrieved.content === note.content;
    }
  )
);
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Storage init blocks app startup | Use async initialization with loading state |
| Auto-save causes performance issues | Configurable debounce, can disable |
| Recovery fails to restore all data | Export partial data, inform user |
| Property tests are slow | Run in CI only, skip in dev by default |

## Migration Plan

1. **Phase 2.7:** Add storage initialization to App.jsx
2. **Phase 2.8:** Implement auto-save middleware
3. **Phase 2.9:** Add recovery utilities
4. **Phase 2.2 & 2.5:** Write property tests

No data migration required - changes are additive.

## Open Questions

None - all technical decisions have been made based on existing RFC 0002 specifications.
