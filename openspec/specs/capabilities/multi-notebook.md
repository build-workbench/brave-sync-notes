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

## Requirements (Detailed)

### Requirement: Notebook state is restored from client storage
The Client SHALL restore notebooks, notebook-scoped notes, and the active notebook selection from client storage during application initialization.

#### Scenario: Existing notebook data is restored
- **WHEN** the application starts and notebook data exists in client storage
- **THEN** the system SHALL load all stored notebooks
- **AND** restore notes associated with each notebook
- **AND** restore the previously active notebook and active note when they still exist

#### Scenario: Legacy single-chain state is migrated
- **WHEN** the application starts without notebook records but with legacy single-note state
- **THEN** the system SHALL create a default notebook from the legacy sync context
- **AND** persist the current note into that notebook
- **AND** mark the migrated notebook as the active notebook

### Requirement: Notebook actions are notebook-scoped
The Client SHALL scope note creation, selection, renaming, and deletion to the active notebook.

#### Scenario: Creating a note in the active notebook
- **WHEN** the user creates a note while a notebook is active
- **THEN** the system SHALL associate the new note with the active notebook
- **AND** make the new note the active note

#### Scenario: Switching notebooks changes visible notes
- **WHEN** the user switches from one notebook to another
- **THEN** the system SHALL show only notes associated with the selected notebook
- **AND** update the active note to a note within that notebook or clear the editor if no note exists

#### Scenario: Deleting a notebook removes associated notes
- **WHEN** the user confirms deletion of a notebook
- **THEN** the system SHALL remove the notebook from client storage
- **AND** remove notes associated with that notebook
- **AND** choose a new active notebook if one remains

#### Scenario: Deleting the last notebook clears active notebook state
- **WHEN** the user confirms deletion of the last remaining notebook
- **THEN** the system SHALL remove that notebook from client storage
- **AND** clear the active notebook selection
- **AND** clear the active note and notebook mnemonic until a new notebook is created or imported

### Requirement: Notebook sharing metadata uses the notebook sync context
The Client SHALL generate notebook sharing output from the active notebook's mnemonic and metadata.

#### Scenario: QR generation for the active notebook
- **WHEN** the user requests a QR code for notebook sharing
- **THEN** the system SHALL encode the active notebook's mnemonic
- **AND** include notebook-identifying metadata needed to import that notebook on another device

## Test Properties

| Property | Description | Validates |
|----------|-------------|-----------|
| Property 5 | Notebook isolation | Req 3.1 |
| Property 13 | Notebook CRUD operations | Req 3.2 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-28 | Added storage restoration, scoped actions, sharing metadata requirements |
| 2026-04-23 | Initial capability spec |
