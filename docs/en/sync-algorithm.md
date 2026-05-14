---
layout: default
title: Sync Algorithm
description: Synchronization strategy, conflict detection, and resolution algorithms for Note Sync Now.
permalink: /docs/en/sync-algorithm/
lang: en
---

# Sync Algorithm

This document details Note Sync Now's synchronization strategy, chunked transfer, and conflict resolution algorithms.

## Sync Strategy Overview

```mermaid
graph TB
    subgraph Local-First
        A[User edits] --> B[Local immediate update]
        B --> C[Debounce queue]
    end

    subgraph Async Sync
        C --> D[Encrypt content]
        D --> E{Content size}
        E -->|Small| F[Direct send]
        E -->|Large| G[Chunked send]
    end

    subgraph Server Processing
        F --> H[Validate and store]
        G --> I[Reassemble and store]
    end

    subgraph Broadcast
        H --> J[Broadcast to other devices]
        I --> J
    end
```

## Local Update Strategy

### Debounce Mechanism

```mermaid
sequenceDiagram
    participant User as User
    participant Debounce as Debounce queue
    participant Sync as Sync engine

    User->>Debounce: Type 'a'
    Note over Debounce: Start 300ms timer

    User->>Debounce: Type 'b'
    Note over Debounce: Reset timer

    User->>Debounce: Type 'c'
    Note over Debounce: Reset timer

    Note over Debounce: After 300ms
    Debounce->>Sync: Send 'abc'
```

**Debounce Parameters**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Delay time | 300ms | Balance responsiveness and efficiency |
| Max wait | 3s | Ensure eventual sync |
| Immediate trigger | Blur/submit | User action complete |

### Local State Management

```typescript
// State update flow
interface NoteState {
  content: string           // Current content
  lastSyncedHash: string    // Last synced hash
  isDirty: boolean          // Has unsynced changes
  pendingUpdate: string | null  // Content to send
}

function onUserInput(newContent: string) {
  state.content = newContent
  state.isDirty = true

  // Add to debounce queue
  debounceQueue.add(() => {
    state.pendingUpdate = newContent
    syncEngine.pushUpdate(newContent)
  })
}
```

## Chunked Transfer Algorithm

### Chunking Strategy

```mermaid
flowchart TB
    A[Content] --> B{Size > 100KB?}
    B -->|No| C[Single chunk transfer]
    B -->|Yes| D[Chunked processing]

    D --> E[Calculate chunk count]
    E --> F[Chunk size: 100KB]

    F --> G[Chunk 1]
    F --> H[Chunk 2]
    F --> I[Chunk N]

    G --> J[Encrypt and send]
    H --> J
    I --> J

    J --> K[Server reassembly]
    K --> L[Broadcast complete content]

    style C fill:#c8e6c9
    style L fill:#c8e6c9
```

**Chunking Parameters**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Chunk threshold | 100 KB | Chunk if exceeds this size |
| Chunk size | 100 KB | Size per chunk |
| Max total size | 5 MB | Single update limit |
| Chunk timeout | 30 s | Chunk transfer timeout |

### Chunking Implementation

```typescript
// Chunked send pseudocode
async function sendChunked(content: string, key: CryptoKey, roomId: string) {
  const CHUNK_SIZE = 100 * 1024  // 100 KB
  const encoded = new TextEncoder().encode(content)
  const totalChunks = Math.ceil(encoded.length / CHUNK_SIZE)

  if (totalChunks === 1) {
    // Single chunk direct send
    const encrypted = await encrypt(encoded, key, roomId)
    socket.emit('push-update', { roomId, encryptedData: encrypted })
    return
  }

  // Chunked send
  const sessionId = generateSessionId()

  for (let i = 0; i < totalChunks; i++) {
    const chunk = encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const encrypted = await encrypt(chunk, key, roomId)

    socket.emit('push-update', {
      roomId,
      encryptedData: encrypted,
      chunkIndex: i,
      totalChunks,
      sessionId
    })

    // Wait for ack before sending next chunk
    await waitForAck()
  }
}
```

### Server Reassembly

```typescript
// Server reassembly pseudocode
const chunkSessions = new Map<string, ChunkSession>()

function handleChunkedUpdate(data: PushUpdate) {
  if (!data.chunkIndex) {
    // Single chunk direct processing
    processUpdate(data)
    return
  }

  // Chunk reassembly
  const session = chunkSessions.get(data.sessionId) || createSession(data)
  session.chunks[data.chunkIndex] = data.encryptedData

  if (session.isComplete()) {
    const fullData = session.reassemble()
    processUpdate({ ...data, encryptedData: fullData })
    chunkSessions.delete(data.sessionId)
  }

  // Timeout cleanup
  setTimeout(() => chunkSessions.delete(data.sessionId), 30000)
}
```

## Conflict Detection Algorithm

### Version Vector

```mermaid
graph LR
    subgraph Device A
        A1[v1: "Hello"] --> A2[v2: "Hello World"]
    end

    subgraph Device B
        B1[v1: "Hello"] --> B2[v2: "Hello!"]
    end

    A2 --> C{Conflict detection}
    B2 --> C

    C --> D[Base version: v1]
    C --> E[Local change: "World"]
    C --> F[Remote change: "!"]

    style C fill:#fff9c4
```

### Hash Comparison

```typescript
// Conflict detection pseudocode
interface ConflictState {
  localHash: string      // Local content hash
  baseHash: string       // Base version hash
  remoteHash: string     // Remote content hash
}

function detectConflict(state: ConflictState): ConflictResult {
  // No conflict: remote matches local
  if (state.localHash === state.remoteHash) {
    return { type: 'none' }
  }

  // Local unchanged: apply remote directly
  if (state.localHash === state.baseHash) {
    return { type: 'apply-remote' }
  }

  // Remote is old version: ignore
  if (state.remoteHash === state.baseHash) {
    return { type: 'ignore-remote' }
  }

  // True conflict: needs merge
  return { type: 'conflict', needsMerge: true }
}
```

## Three-Way Merge Algorithm

### Algorithm Principle

```mermaid
flowchart TB
    A[Local version L] --> D[Diff calculation]
    B[Base version B] --> D
    D --> E[Local diff diffL]

    B --> F[Diff calculation]
    C[Remote version R] --> F
    F --> G[Remote diff diffR]

    E --> H[Merge diffs]
    G --> H
    B --> H

    H --> I{Conflict region?}
    I -->|No| J[Successful merge]
    I -->|Yes| K[Mark conflict]

    style J fill:#c8e6c9
    style K fill:#ffcdd2
```

### Merge Implementation

```typescript
// Three-way merge pseudocode
function threeWayMerge(
  local: string,
  base: string,
  remote: string
): MergeResult {
  // 1. Calculate diffs
  const localDiff = diff(base, local)   // B → L diff
  const remoteDiff = diff(base, remote) // B → R diff

  // 2. Attempt merge
  const conflicts: Conflict[] = []
  const merged: string[] = []

  // Iterate all regions
  for (const region of allRegions(localDiff, remoteDiff)) {
    if (region.onlyLocal) {
      // Only local change: apply local
      merged.push(region.localChange)
    } else if (region.onlyRemote) {
      // Only remote change: apply remote
      merged.push(region.remoteChange)
    } else if (region.localChange === region.remoteChange) {
      // Same change: pick either
      merged.push(region.localChange)
    } else {
      // Conflict: mark and keep both
      conflicts.push({
        position: region.position,
        local: region.localChange,
        remote: region.remoteChange,
        base: region.baseContent
      })
      merged.push(markConflict(region))
    }
  }

  return {
    content: merged.join(''),
    conflicts,
    hasConflicts: conflicts.length > 0
  }
}
```

### Conflict Marker Format

```
<<<<<<< LOCAL
Local modified content
=======
Remote modified content
>>>>>>> REMOTE
```

## Reconnection Recovery Mechanism

### Reconnection Flow

```mermaid
sequenceDiagram
    participant Client as Client
    participant Server as Server
    participant DB as Persistence Layer

    Note over Client: Network disconnected
    Client->>Client: Detect disconnection

    Note over Client: Auto reconnect
    Client->>Server: reconnect

    Note over Client: Restore state
    Client->>Server: join-chain (roomId)
    Server->>DB: Query latest state
    DB-->>Server: Return ciphertext
    Server-->>Client: sync-update

    Client->>Client: Decrypt content
    Client->>Client: Conflict detection

    alt No conflict
        Client->>Client: Apply remote content
    else Has conflict
        Client->>Client: Enter conflict resolution flow
    end
```

### Offline Queue

```mermaid
flowchart TB
    A[User edit] --> B{Online?}
    B -->|Yes| C[Immediate sync]
    B -->|No| D[Add to offline queue]

    D --> E[Store to IndexedDB]

    F[Network restored] --> G[Process queue]
    G --> H{Queue not empty?}
    H -->|Yes| I[Send queue content]
    I --> H
    H -->|No| J[Queue cleared]

    style C fill:#c8e6c9
    style J fill:#c8e6c9
```

**Offline Queue Properties**:

| Property | Value | Description |
|----------|-------|-------------|
| Storage | IndexedDB | Persistent |
| Max entries | 100 | Prevent unbounded growth |
| Merge strategy | Last valid | Keep only latest per note |

## Performance Optimization

### Incremental Sync

```mermaid
graph LR
    A[Full content] --> B[Calculate diff]
    B --> C[Send diff only]
    C --> D[Server apply diff]

    E[Full content] --> F[Diff + base version]
    F --> G[Reduced transfer size]

    style G fill:#c8e6c9
```

**Optimization Effect**:

| Scenario | No optimization | Incremental sync |
|----------|-----------------|------------------|
| Small edit (10B) | Send 1MB | Send ~100B |
| Large doc (1MB) | Send 1MB each time | Send diff only |

### Compression

```typescript
// Optional compression layer
async function compressAndEncrypt(content: string): Promise<string> {
  // 1. Compress
  const compressed = await compress(content)  // gzip/brotli

  // 2. Encrypt
  const encrypted = await encrypt(compressed)

  return encrypted
}
```

---

::: tip Algorithm Selection
The current implementation uses simplified three-way merge. For more complex collaboration scenarios, consider:
- OT (Operational Transformation)
- CRDT (Conflict-free Replicated Data Types)
:::
