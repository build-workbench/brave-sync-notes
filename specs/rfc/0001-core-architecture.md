# RFC 0001: Core Architecture

> **Status:** Accepted  
> **Created:** 2026-04-17  
> **Last Updated:** 2026-04-17  
> **Supersedes:** `.kiro/specs/note-sync-improvements/design.md`

## Summary

This RFC describes the core architecture of the Note Sync Now system, focusing on end-to-end encryption, real-time synchronization, and multi-layer storage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  UI Components  │  State Management  │  Service Workers     │
│  (React)        │  (Zustand)         │  (PWA)               │
├─────────────────────────────────────────────────────────────┤
│  Sync Engine    │  Conflict Resolver │  Crypto Module       │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer  │  IndexedDB         │  LocalStorage        │
└─────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Handler  │  Room Manager  │  Auth Module         │
├─────────────────────────────────────────────────────────────┤
│  Conflict Detector  │  Message Queue │  Session Manager     │
├─────────────────────────────────────────────────────────────┤
│  Persistence Layer  │  Redis/SQLite  │  File System         │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **End-to-End Encryption First**: Note content is encrypted on the client side; server only receives ciphertext
2. **Mnemonic-Driven Recovery**: Client derives room and encryption keys from 12-word mnemonic
3. **Stateless Server**: Server focuses on synchronization forwarding, short-term memory, and persistence fallback
4. **Explicit Conflict Handling**: Local and remote update conflicts are not simplified to overwrite operations
5. **Multi-Layer Storage Degradation**: Prefer persistent storage, fall back to memory mode when unavailable

## Data Flow

1. **Write Flow**: User edits → Local storage → Encrypt → WebSocket → Server → Broadcast to other devices
2. **Read Flow**: Server push → Decrypt → Conflict detection → Merge → Update UI → Save locally
3. **Offline Flow**: User edits → Local queue → Network restored → Batch sync → Conflict resolution

## Core Components

### 1. Persistence Module

#### Server Storage Interface

```typescript
interface PersistenceAdapter {
  // Save sync chain data
  saveRoom(roomId: string, data: EncryptedRoomData): Promise<void>;

  // Get sync chain data
  getRoom(roomId: string): Promise<EncryptedRoomData | null>;

  // Delete expired data
  cleanupExpired(olderThan: Date): Promise<number>;

  // Save operation log
  appendLog(roomId: string, operation: Operation): Promise<void>;

  // Get operation log
  getLog(roomId: string, since: number): Promise<Operation[]>;
}
```

#### Client Storage Interface

```typescript
interface ClientStorage {
  // Notebook operations
  saveNotebook(notebook: Notebook): Promise<void>;
  getNotebook(id: string): Promise<Notebook | null>;
  listNotebooks(): Promise<Notebook[]>;
  deleteNotebook(id: string): Promise<void>;

  // Note operations
  saveNote(notebookId: string, note: Note): Promise<void>;
  getNote(notebookId: string, noteId: string): Promise<Note | null>;
  listNotes(notebookId: string): Promise<Note[]>;
  deleteNote(notebookId: string, noteId: string): Promise<void>;

  // History
  saveHistory(noteId: string, entry: HistoryEntry): Promise<void>;
  getHistory(noteId: string, limit?: number): Promise<HistoryEntry[]>;

  // Offline queue
  enqueueOperation(op: PendingOperation): Promise<void>;
  dequeueOperations(): Promise<PendingOperation[]>;
  clearQueue(): Promise<void>;
}
```

### 2. Conflict Resolution Module

#### Conflict Detector

```typescript
interface ConflictDetector {
  // Detect conflict existence
  detectConflict(
    local: VersionedContent,
    remote: VersionedContent
  ): ConflictInfo | null;

  // Three-way merge
  threeWayMerge(
    base: string,
    local: string,
    remote: string
  ): MergeResult;
}

interface ConflictInfo {
  type: 'concurrent_edit' | 'offline_divergence';
  localVersion: VersionedContent;
  remoteVersion: VersionedContent;
  commonAncestor?: VersionedContent;
}

interface MergeResult {
  success: boolean;
  merged?: string;
  conflicts?: ConflictRegion[];
}

interface ConflictRegion {
  startLine: number;
  endLine: number;
  localContent: string;
  remoteContent: string;
}
```

#### Conflict Resolution Strategies

```typescript
type ConflictResolutionStrategy =
  | 'manual'           // User selects manually
  | 'last-write-wins'  // Last write wins
  | 'first-write-wins' // First write wins
  | 'auto-merge';      // Auto merge

interface ConflictResolver {
  resolve(
    conflict: ConflictInfo,
    strategy: ConflictResolutionStrategy
  ): Promise<string>;
}
```

### 3. Sync Engine

#### Operational Transformation

```typescript
interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  deviceId: string;
  version: number;
}

interface SyncEngine {
  // Apply local operation
  applyLocal(op: Operation): void;

  // Apply remote operation
  applyRemote(op: Operation): void;

  // Transform operations
  transform(op1: Operation, op2: Operation): [Operation, Operation];

  // Get current version
  getVersion(): number;

  // Sync state
  getState(): SyncState;
}

type SyncState = 'synced' | 'syncing' | 'conflict' | 'offline';
```

## Data Models

### Versioned Content

```typescript
interface VersionedContent {
  content: string;
  version: number;
  timestamp: number;
  deviceId: string;
  parentVersion?: number;
  hash: string;  // SHA-256 hash
}
```

### History Entry

```typescript
interface HistoryEntry {
  id: string;
  noteId: string;
  content: string;
  delta?: string;  // Difference from previous version
  version: number;
  timestamp: number;
  deviceName: string;
  tags: string[];
}
```

### Encrypted Data Format

```typescript
interface EncryptedData {
  iv: string;           // Initialization vector
  ciphertext: string;   // Encrypted content
  tag: string;          // Authentication tag (GCM mode)
  version: number;      // Encryption version
}
```

### Notebook

```typescript
interface Notebook {
  id: string;
  name: string;
  mnemonic: string;
  encryptionKey: string;
  roomId: string;
  createdAt: number;
  updatedAt: number;
  notes: Note[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AUTH_ERROR = 'AUTH_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  code: string;
  recoverable: boolean;
  context?: Record<string, any>;
}
```

### Error Recovery Strategies

| Error Type | Recovery Strategy |
|------------|-------------------|
| NETWORK_ERROR | Auto retry with exponential backoff, up to 10 times |
| ENCRYPTION_ERROR | Prompt user to check keys, no auto retry |
| STORAGE_ERROR | Try fallback storage, notify user |
| CONFLICT_ERROR | Show conflict resolution UI |
| VALIDATION_ERROR | Show error message, block operation |
| QUOTA_EXCEEDED | Prompt to clean history, provide cleanup options |
| AUTH_ERROR | Prompt to rejoin sync chain |

## Implementation Phases

### Phase 1: Infrastructure (Completed)

- [x] Server persistence storage (Redis + SQLite)
- [x] Client storage layer (IndexedDB + LocalStorage)
- [x] Test framework configuration (Vitest + Jest + fast-check)

### Phase 2: Core Features (In Progress)

- [x] Conflict detection and resolution
- [ ] Multi-notebook support
- [x] Offline queue

### Phase 3: Enhanced Features (Planned)

- [ ] PWA support
- [ ] Version history and diff comparison
- [ ] Search and tags

### Phase 4: Collaboration & Security (Planned)

- [ ] Collaborative cursors
- [ ] Key rotation
- [ ] Device management

### Phase 5: Import/Export (Planned)

- [ ] Batch export
- [ ] Format conversion
- [ ] Backup and recovery

---

## Related Documents

- [Product Requirements](../product/note-sync-system.md)
- [API Specification](../api/openapi.yaml)
- [Database Schema](../db/schema-v1.dbml)
- [Testing Strategy](../testing/test-strategy.md)
