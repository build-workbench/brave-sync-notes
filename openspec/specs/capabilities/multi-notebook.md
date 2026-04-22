# Capability: Multi-Notebook

> **Status:** Active
> **Created:** 2026-04-23
> **Last Updated:** 2026-04-23

## Overview

Support for creating and managing multiple notebooks, each with its own sync chain and mnemonic. Enables users to organize notes into separate collections.

## References

### Product Requirements
- [Requirement 3: Multi-Notebook Support](../../specs/product/note-sync-system.md#requirement-3-multi-notebook-support)

### Technical Design
- [RFC 0002 §4: Multi-Note Support](../../specs/rfc/0002-comprehensive-refactor.md#phase-4-multi-note-support)

### Tests
- [Property 5: Notebook Isolation](../../specs/testing/test-strategy.md#property-5-notebook-isolation)

## Boundaries

### In Scope
- Create/delete/rename notebooks
- Each notebook has unique mnemonic and sync chain
- Notebook list management
- Switch between notebooks
- Notebook metadata (name, icon, created date)

### Out of Scope
- Notebook sharing between users
- Nested notebooks/folders
- Notebook templates

## Dependencies

### Depends On
- **sync-core** - Each notebook is a separate sync chain
- **storage** - Notebook metadata storage
- **encryption** - Each notebook has unique encryption key

### Dependents
- **version-history** - History per notebook

## Interface

### Client API
```typescript
interface MultiNotebookAPI {
  // Notebook management
  createNotebook(name: string): Promise<Notebook>;
  deleteNotebook(id: string): Promise<void>;
  renameNotebook(id: string, newName: string): Promise<void>;

  // Notebook queries
  getNotebooks(): Notebook[];
  getActiveNotebook(): Notebook;
  setActiveNotebook(id: string): void;

  // Note management within notebook
  getNotes(notebookId: string): Note[];
  createNote(notebookId: string, title?: string): Note;
  deleteNote(notebookId: string, noteId: string): void;

  // Mnemonic management
  exportMnemonic(notebookId: string): string;  // 12-word phrase
  importNotebook(mnemonic: string, name: string): Promise<Notebook>;
}
```

### Data Model
```typescript
interface Notebook {
  id: string;
  name: string;
  mnemonic: string;        // Encrypted in storage
  encryptionKey: string;   // Encrypted in storage
  roomId: string;          // SHA256(mnemonic)
  createdAt: number;
  updatedAt: number;
  noteCount: number;
}

interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}
```

## Implementation Notes

### Storage Architecture
- Each notebook stored separately in IndexedDB
- Notebook metadata in a separate store
- Mnemonic encrypted with master key

### Sync Chain Per Notebook
- Each notebook = separate WebSocket room
- Switching notebooks = leave one room, join another
- Multiple notebooks can sync in background (optional)

### UI Considerations
- Sidebar shows notebook list
- Active notebook highlighted
- Note list shows notes in active notebook

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 5 | Notebook isolation | Req 3.1 |
| Property 13 | Notebook CRUD operations | Req 3.2 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial capability spec |
