---
layout: default
title: API Design
description: WebSocket events and REST interface design for Note Sync Now.
permalink: /docs/en/api-design/
lang: en
---

# API Design

This document defines the complete API interface specifications for Note Sync Now.

## Interface Overview

```mermaid
graph TB
    subgraph Client
        C[Web Client]
    end

    subgraph WebSocket Interface
        WS1[join-chain]
        WS2[push-update]
        WS3[request-sync]
        WS4[sync-update]
        WS5[room-info]
        WS6[update-ack]
        WS7[error]
    end

    subgraph REST Interface
        R1[GET /health]
        R2[GET /stats]
    end

    C --> WS1 & WS2 & WS3
    WS4 & WS5 & WS6 & WS7 --> C
    C --> R1 & R2

    style WS1 fill:#e3f2fd
    style WS2 fill:#e3f2fd
    style WS3 fill:#e3f2fd
    style WS4 fill:#e8f5e9
    style WS5 fill:#e8f5e9
    style WS6 fill:#e8f5e9
    style WS7 fill:#ffebee
```

## WebSocket Interface

### Connection

```
ws://<host>:<port>/
```

**Connection Parameters**:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `transports` | `['websocket']` | WebSocket only |
| `reconnection` | `true` | Auto reconnect |
| `reconnectionDelay` | `1000ms` | Reconnect delay |
| `reconnectionAttempts` | `Infinity` | Infinite retry |

### join-chain

Join a sync chain (room).

```typescript
// Client sends
socket.emit('join-chain', {
  roomId: string,      // Room ID, 32-character hexadecimal
  deviceName: string   // Device name, 1-50 characters
})

// Server responds
// 1. If room has history data
socket.emit('sync-update', {
  encryptedData: string,  // Base64-encoded ciphertext
  fromDevice: 'server',   // Source identifier
  timestamp: number       // Timestamp
})

// 2. Broadcast room info
socket.emit('room-info', {
  roomId: string,
  devices: string[],      // Current device list
  memberCount: number     // Member count
})
```

**Validation Rules**:

| Field | Rule | Error Code |
|-------|------|------------|
| roomId | 32-character hexadecimal | `INVALID_ROOM_ID` |
| deviceName | 1-50 characters | `INVALID_DEVICE_NAME` |

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant Others as Other Devices

    C->>S: join-chain
    S->>S: Validate parameters
    S->>S: Join room
    S->>S: Query history ciphertext

    alt Has history data
        S-->>C: sync-update (history ciphertext)
    end

    S->>Others: room-info (update members)
    S-->>C: room-info (current members)
```

### push-update

Push encrypted update to room.

```typescript
// Client sends
socket.emit('push-update', {
  roomId: string,              // Room ID
  encryptedData: string,       // Base64-encoded ciphertext
  chunkIndex?: number,         // Chunk index (chunked mode)
  totalChunks?: number,        // Total chunks (chunked mode)
  sessionId?: string           // Chunk session ID
})

// Server acknowledges
socket.emit('update-ack', {
  success: boolean,
  timestamp: number,
  error?: string               // Failure reason
})

// Broadcast to other members
socket.emit('sync-update', {
  encryptedData: string,
  fromDevice: string,
  timestamp: number
})
```

**Validation Rules**:

| Field | Rule | Error Code |
|-------|------|------------|
| roomId | Joined room | `NOT_IN_ROOM` |
| encryptedData | Non-empty string | `INVALID_DATA` |
| Data size | < 5 MB | `DATA_TOO_LARGE` |
| Rate | 30/min | `RATE_LIMITED` |

**Sequence Diagram**:

```mermaid
sequenceDiagram
    participant C as Sending Client
    participant S as Server
    participant R as Receiving Client

    C->>S: push-update
    S->>S: Validate membership
    S->>S: Validate data format
    S->>S: Validate size limit
    S->>S: Validate rate limit

    alt Validation passed
        S->>S: Store ciphertext
        S-->>C: update-ack (success)
        S->>R: sync-update
    else Validation failed
        S-->>C: update-ack (failed)
        S-->>C: error
    end
```

### request-sync

Actively request latest sync data.

```typescript
// Client sends
socket.emit('request-sync', {
  roomId: string
})

// Server responds
socket.emit('sync-update', {
  encryptedData: string,
  fromDevice: 'server',
  timestamp: number
})
```

**Use Cases**:

- Recovery after disconnection
- Check for updates when switching to foreground
- Manual refresh

### sync-update

Receive sync update (server push).

```typescript
// Server pushes
socket.on('sync-update', (data: {
  encryptedData: string,   // Base64-encoded ciphertext
  fromDevice: string,      // Source device
  timestamp: number        // Timestamp
}) => {
  // 1. Decrypt content
  // 2. Conflict detection
  // 3. Update local state
})
```

### room-info

Room member information update.

```typescript
// Server pushes
socket.on('room-info', (data: {
  roomId: string,
  devices: Array<{
    name: string,
    joinedAt: number
  }>,
  memberCount: number
}) => {
  // Update UI display
})
```

### update-ack

Server acknowledges update received.

```typescript
// Server responds
socket.on('update-ack', (data: {
  success: boolean,
  timestamp: number,
  error?: string
}) => {
  if (data.success) {
    // Update lastSyncedHash
  } else {
    // Handle error
  }
})
```

### error

Server error notification.

```typescript
// Server pushes
socket.on('error', (data: {
  code: string,
  message: string,
  details?: any
}) => {
  // Handle error
})
```

**Error Codes**:

| Error Code | Description | Client Handling |
|------------|-------------|-----------------|
| `INVALID_ROOM_ID` | Room ID format error | Check input |
| `INVALID_DEVICE_NAME` | Device name format error | Check input |
| `INVALID_DATA` | Data format error | Check encryption flow |
| `NOT_IN_ROOM` | Not joined room | Re-join-chain |
| `DATA_TOO_LARGE` | Data exceeds 5MB | Enable chunking |
| `RATE_LIMITED` | Rate limit exceeded | Backoff retry |
| `ROOM_FULL` | Room full | Wait or change room |
| `INTERNAL_ERROR` | Server internal error | Retry |

## REST Interface

### GET /health

Health check endpoint.

```typescript
// Request
GET /health

// Response 200
{
  "status": "ok",
  "connections": number,      // Current connection count
  "rooms": number,            // Room count
  "persistence": {
    "type": "redis" | "sqlite" | "memory",
    "connected": boolean
  },
  "uptime": number            // Uptime (seconds)
}
```

**Uses**:
- Container health check
- Load balancer probe
- Monitoring alerts

### GET /stats

Statistics endpoint.

```typescript
// Request
GET /stats

// Response 200
{
  "connections": number,        // Current connection count
  "rooms": number,              // Active room count
  "memory": {
    "heapUsed": number,         // Heap used (bytes)
    "heapTotal": number,        // Heap total (bytes)
    "rss": number               // RSS (bytes)
  },
  "persistence": {
    "type": string,             // Storage type
    "connected": boolean,       // Connection status
    "keys": number              // Stored key count
  }
}
```

**Uses**:
- Operations monitoring
- Capacity planning
- Troubleshooting

## Complete Interaction Flows

### Create New Sync Chain

```mermaid
sequenceDiagram
    actor User as User
    participant App as Client
    participant Server as Server

    User->>App: Click "Create Sync Chain"
    App->>App: Generate mnemonic
    App->>App: Derive roomId and key
    App-->>User: Display QR code

    App->>Server: WebSocket connect
    App->>Server: join-chain
    Server-->>App: room-info (1 device)

    Note over User: Scan to join

    App->>App: Wait for other devices
    Server->>App: room-info (2 devices)
```

### Real-time Sync

```mermaid
sequenceDiagram
    actor UserA as User A
    actor UserB as User B
    participant AppA as Device A
    participant Server as Server
    participant AppB as Device B

    UserA->>AppA: Edit note
    AppA->>AppA: Encrypt content
    AppA->>Server: push-update

    Server->>Server: Store ciphertext
    Server-->>AppA: update-ack

    Server->>AppB: sync-update
    AppB->>AppB: Decrypt content
    AppB-->>UserB: Display update
```

### Conflict Resolution

```mermaid
sequenceDiagram
    actor UserA as User A
    actor UserB as User B
    participant AppA as Device A
    participant Server as Server
    participant AppB as Device B

    Note over AppA, AppB: Concurrent editing
    UserA->>AppA: Edit content X
    UserB->>AppB: Edit content Y

    AppA->>Server: push-update (X)
    AppB->>Server: push-update (Y)

    Server->>AppB: sync-update (X)
    AppB->>AppB: Conflict detection
    AppB-->>UserB: Prompt conflict

    Server->>AppA: sync-update (Y)
    AppA->>AppA: Conflict detection
    AppA-->>UserA: Prompt conflict

    UserB->>AppB: Choose to keep X
    AppB->>Server: push-update (resolved)
    Server->>AppA: sync-update (resolved)
```

## Rate Limiting Details

```mermaid
graph TB
    A[Request] --> B{Type check}

    B -->|push-update| C[30/min/socket]
    B -->|join-chain| D[10/min/socket]
    B -->|connection| E[10/min/IP]

    C --> F{Exceeded?}
    D --> F
    E --> F

    F -->|No| G[Normal processing]
    F -->|Yes| H[Return RATE_LIMITED]

    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

## Implementation Reference

### Key Files

| File | Function |
|------|----------|
| `apps/api/index.js` | Server entry, event handling |
| `apps/web/src/hooks/useSocket.js` | Client sync engine |
| `apps/api/src/persistence/PersistenceManager.js` | Persistence management |
| `apps/api/src/persistence/PersistenceAdapter.js` | Storage adapter |

---

::: tip API Version
Current API version is v1. Future versions will follow semantic versioning, ensuring backward compatibility.
:::
