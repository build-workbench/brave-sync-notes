# Capability: Conflict Resolution

> **Status:** Active
> **Created:** 2026-04-23
> **Last Updated:** 2026-04-23

## Overview

Three-way merge algorithm for detecting and resolving conflicts when multiple devices edit the same note simultaneously. Provides both automatic resolution and manual resolution UI.

## References

### Product Requirements
- [Requirement 2: Conflict Detection & Resolution](../../specs/product/note-sync-system.md#requirement-2-conflict-detection--resolution)

### Technical Design
- [RFC 0001 §3: Conflict Resolution Module](../../specs/rfc/0001-core-architecture.md#conflict-resolution-module)

### Tests
- [Property 3: Conflict Detection Correctness](../../specs/testing/test-strategy.md#property-3-conflict-detection-correctness)
- [Property 4: Merge Preservation](../../specs/testing/test-strategy.md#property-4-merge-preservation)

## Boundaries

### In Scope
- Conflict detection based on version divergence
- Three-way merge algorithm
- Manual resolution UI with conflict markers
- Merge history tracking
- Automatic resolution for non-overlapping changes

### Out of Scope
- Real-time collaboration (Google Docs style)
- Conflict prevention (locking)
- AI-assisted merge suggestions

## Dependencies

### Depends On
- **sync-core** - Receives updates that may cause conflicts
- **version-history** - Uses history for three-way merge

### Dependents
- **offline-mode** - Conflicts likely when syncing offline changes

## Interface

### Client API
```typescript
interface ConflictResolutionAPI {
  // Check for conflicts
  detectConflict(local: NoteVersion, remote: NoteVersion): Conflict | null;

  // Attempt automatic merge
  autoMerge(conflict: Conflict): MergeResult;

  // Get merge suggestions
  getMergeSuggestions(conflict: Conflict): MergeSuggestion[];

  // Apply manual resolution
  applyResolution(conflict: Conflict, resolution: Resolution): void;

  // Event handlers
  onConflict(callback: (conflict: Conflict) => void): void;
}
```

### Types
```typescript
interface Conflict {
  id: string;
  noteId: string;
  localVersion: NoteVersion;
  remoteVersion: NoteVersion;
  baseVersion: NoteVersion;  // Common ancestor
  detectedAt: number;
}

interface MergeResult {
  success: boolean;
  mergedContent?: string;
  conflicts?: ConflictRegion[];
}

interface ConflictRegion {
  startLine: number;
  endLine: number;
  localContent: string;
  remoteContent: string;
}
```

## Implementation Notes

### Three-Way Merge Algorithm
1. Find common ancestor (base version)
2. Compare local vs base, remote vs base
3. Identify changed regions
4. If changes don't overlap → auto-merge
5. If changes overlap → conflict markers

### Conflict Markers
```
<<<<<<< LOCAL
local content here
=======
remote content here
>>>>>>> REMOTE
```

### Resolution Strategies
| Strategy | When Used |
|----------|-----------|
| Auto-merge | Non-overlapping changes |
| Keep local | User chooses local |
| Keep remote | User chooses remote |
| Manual edit | User edits merged result |

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 3 | Conflict detection correctness | Req 2.1 |
| Property 4 | Merge preservation | Req 2.2 |
| Property 12 | No data loss on merge | Req 2.3 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial capability spec |
