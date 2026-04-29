# Proposal: Version Snapshots

## Problem

Users have no way to view or restore previous versions of a note. If a note is accidentally modified or deleted, there's no recovery mechanism. The current sync system tracks all updates, but provides no UI to view history or revert changes.

Users want:
- See a timeline of note edits
- View old versions of a note
- Restore from a previous version
- See who made changes (in future multi-user feature)

## Solution

Implement **per-notebook snapshots**:

1. **Automatic snapshots** - Save note state at key intervals (on app close, manual save)
2. **Version browser** - UI to view and restore snapshots
3. **Diff view** - Show what changed between versions
4. **Storage-efficient** - Store only diffs, not full copies

## Why Now

- Multi-notebook gives us clear versioning scope (versions per notebook)
- Yjs provides version tracking (updates have timestamps/clocks)
- Local storage is cheap (IndexedDB has generous quota)
- Completes the core feature set

## Scope

- Take snapshots on app close and optionally on manual trigger
- Store 50 most recent snapshots per note
- UI to browse versions and restore
- Show timestamp and approximate change size for each version
- Restore includes reverting to old Yjs state

## Out of Scope

- Sync snapshot metadata to server (defer to cloud sync)
- Automatic cleanup of old snapshots (implement basic retention policy)
- Branching/tagging versions (future feature)
- Diff visualization UI (show text diff in editor)
