# Design: Local Search

## Architecture

```
Note Content
    ↓
Index Builder (on load + on change)
    ↓
Search Index (in-memory)
    ↓
Search UI (input + results)
    ↓
Display Results (highlight matches)
```

## Key Decisions

### 1. Indexing Strategy
- **Decision**: Build index from all stored notes on app load
- **Why**: Fast startup, no external calls
- **Trade-off**: Startup latency ~100ms for 1000 notes
- **Optimization**: Lazy-load index, incremental build

### 2. Search Algorithm
- **Decision**: Simple full-text tokenization (split by whitespace, lowercase)
- **Why**: Fast, predictable, covers 95% of use cases
- **Future**: Add Transformers.js embeddings for semantic search

### 3. Index Persistence
- **Decision**: Rebuild from notes each app load
- **Why**: Small data, fast rebuild; avoids sync issues
- **Alternative**: Store in IndexedDB if needed

### 4. UI Placement
- **Decision**: Search input in Sidebar, results as dropdown below input
- **Why**: Non-intrusive, natural location
- **Behavior**: Show top 10 results; ESC to close; Enter to select first

### 5. Result Display
- **Decision**: Show note title + notebook name + first 100 chars of match
- **Why**: Context for users to identify correct note
- **Future**: Add snippet with highlighted match

## Implementation Phases

### Phase 1: Index Builder
1. Create search index data structure (Map<term, Set<noteId>>)
2. Build index on app startup from stored notes
3. Test: Verify index is correct after load

### Phase 2: Search UI
1. Add search input to Sidebar
2. Create SearchResults component (dropdown)
3. Wire input to query index
4. Display top results
5. Test: Type a search term, see matching results

### Phase 3: Navigation & Updates
1. Click result to navigate to that note
2. Update index when note is created/edited/deleted
3. Test: Create new note, search finds it immediately

### Phase 4: Semantic Search (Optional)
1. Load Transformers.js embedding model
2. Generate embedding for each note
3. Find nearest neighbors to search query embedding
4. Combine with full-text results
5. Test: Semantic searches work (e.g., "encryption" finds "crypto")

## Test Coverage

- Index built correctly on startup
- Full-text search finds all matching notes
- Case-insensitive matching works
- Special characters handled correctly
- Index updates when notes change
- Results display correctly
- Navigation to note works

## Performance Targets

- Search index build time: <500ms for 10k notes
- Search query time: <50ms
- No jank when typing search queries
