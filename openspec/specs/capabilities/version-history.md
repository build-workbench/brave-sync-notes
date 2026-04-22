# Capability: Version History

> **Status:** Active
> **Created:** 2026-04-23
> **Last Updated:** 2026-04-23

## Overview

Note version history tracking with the ability to view past versions, compare diffs, and restore previous versions. Provides audit trail and recovery capabilities.

## References

### Product Requirements
- [Requirement 5: Version History & Recovery](../../specs/product/note-sync-system.md#requirement-5-version-history--recovery)

### Technical Design
- [RFC 0002 §5: History & Version Enhancement](../../specs/rfc/0002-comprehensive-refactor.md#phase-5-history--version-enhancement)

### Tests
- [Property 6-10: History Properties](../../specs/testing/test-strategy.md#properties-6-10)

## Boundaries

### In Scope
- Version tracking per note
- Version diff viewing
- Restore previous version
- Version metadata (timestamp, device, summary)
- Version list UI
- Merge detection (combine rapid saves)

### Out of Scope
- Branching/forking versions
- Version comparison across notes
- AI-generated version summaries

## Dependencies

### Depends On
- **sync-core** - Receives version updates
- **storage** - Version storage

### Dependents
- **conflict-resolution** - Uses versions for three-way merge

## Interface

### Client API
```typescript
interface VersionHistoryAPI {
  // Version queries
  getVersions(noteId: string): NoteVersion[];
  getVersion(noteId: string, version: number): NoteVersion;

  // Version operations
  restoreVersion(noteId: string, version: number): Promise<void>;

  // Diff
  diffVersions(noteId: string, v1: number, v2: number): VersionDiff;

  // Event handlers
  onVersionCreate(callback: (version: NoteVersion) => void): void;
}
```

### Data Model
```typescript
interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  version: number;
  timestamp: number;
  deviceName: string;
  deviceId: string;
  summary?: string;  // Brief description of changes
  delta?: string;    // JSON patch from previous version
}

interface VersionDiff {
  additions: DiffRegion[];
  deletions: DiffRegion[];
  modifications: DiffRegion[];
}

interface DiffRegion {
  startLine: number;
  endLine: number;
  oldContent?: string;
  newContent?: string;
}
```

## Implementation Notes

### Version Storage
- Stored in IndexedDB on client
- Server stores latest version only
- History is client-side only (privacy)

### Version Creation
- New version on each save
- Merge rapid saves (< 5 seconds) into one version
- Max history: 100 versions per note
- Oldest versions auto-deleted

### Restore Flow
1. User selects version to restore
2. Current content saved as new version
3. Selected version content applied
4. New version created with "Restored from vX" summary

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 6 | History ordering | Req 5.1 |
| Property 7 | Version content integrity | Req 5.2 |
| Property 8 | Restore correctness | Req 5.3 |
| Property 9 | Diff accuracy | Req 5.4 |
| Property 10 | Version metadata | Req 5.5 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial capability spec |
