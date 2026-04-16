---
layout: default
title: WebSocket API Reference
description: WebSocket events and message formats for Note Sync Now real-time sync
permalink: /docs/api/websocket/
---

# WebSocket API Reference

This document describes the WebSocket events and message formats used for real-time synchronization in Note Sync Now.

**Base URL**: Determined by `VITE_SOCKET_URL` environment variable (client) or `CORS_ORIGIN` (server).

---

## Connection

### Establishing Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Connection Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server → Client | Connection established |
| `disconnect` | Server → Client | Connection closed |
| `connect_error` | Server → Client | Connection error occurred |
| `reconnect` | Server → Client | Successfully reconnected |

---

## Room Events

### join-chain

Join a synchronization chain/room.

**Direction**: Client → Server

**Payload**:
```json
{
  "roomId": "abc123def456",
  "deviceName": "My Laptop"
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | string | Yes | 12-character room identifier |
| `deviceName` | string | No | Device display name |

**Response (join-chain-response)**:

Direction: Server → Client

```json
{
  "success": true,
  "roomId": "abc123def456",
  "members": 2,
  "hasData": true,
  "data": {
    "encryptedData": "base64encoded...",
    "timestamp": 1744780800000,
    "version": 5
  }
}
```

Or error:
```json
{
  "success": false,
  "error": "Invalid room ID format"
}
```

---

### leave-chain

Leave a synchronization chain.

**Direction**: Client → Server

**Payload**:
```json
{
  "roomId": "abc123def456"
}
```

---

### room-info

Room membership updates broadcast.

**Direction**: Server → Client

**Payload**:
```json
{
  "roomId": "abc123def456",
  "members": [
    {
      "id": "socket-id-1",
      "deviceName": "My Laptop",
      "joinedAt": 1744780800000
    },
    {
      "id": "socket-id-2",
      "deviceName": "My Phone",
      "joinedAt": 1744780801000
    }
  ],
  "count": 2
}
```

---

## Sync Events

### push-update

Send encrypted content update to the server.

**Direction**: Client → Server

**Payload - Standard Update**:
```json
{
  "roomId": "abc123def456",
  "encryptedData": "base64encodedencryptedcontent...",
  "timestamp": 1744780800000,
  "version": 6,
  "deviceId": "device-uuid"
}
```

**Payload - Chunked Update (First)**:
```json
{
  "roomId": "abc123def456",
  "chunk": {
    "id": "chunk-uuid",
    "index": 0,
    "total": 3,
    "data": "base64encodedchunk..."
  },
  "isChunked": true
}
```

**Payload - Chunked Update (Continuation)**:
```json
{
  "roomId": "abc123def456",
  "chunk": {
    "id": "chunk-uuid",
    "index": 1,
    "total": 3,
    "data": "base64encodedchunk..."
  },
  "isChunked": true
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | string | Yes | Room identifier |
| `encryptedData` | string | Yes* | Base64-encoded encrypted content (*for non-chunked) |
| `timestamp` | number | Yes | Update timestamp (ms since epoch) |
| `version` | number | Yes | Content version number |
| `deviceId` | string | Yes | Unique device identifier |
| `isChunked` | boolean | No | Whether this is a chunked transfer |
| `chunk` | object | No* | Chunk information (*for chunked) |

**Response (update-ack)**:

Direction: Server → Client

```json
{
  "success": true,
  "timestamp": 1744780800020,
  "version": 6
}
```

Or error:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

---

### sync-update

Receive encrypted content update from another client.

**Direction**: Server → Client

**Payload**:
```json
{
  "roomId": "abc123def456",
  "encryptedData": "base64encodedencryptedcontent...",
  "timestamp": 1744780800000,
  "version": 6,
  "deviceId": "sender-device-uuid"
}
```

---

### request-sync

Request current room state (for reconnection or forced sync).

**Direction**: Client → Server

**Payload**:
```json
{
  "roomId": "abc123def456",
  "lastVersion": 5
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roomId` | string | Yes | Room identifier |
| `lastVersion` | number | No | Last known version (for comparison) |

**Response (request-sync-response)**:

```json
{
  "success": true,
  "hasUpdate": true,
  "data": {
    "encryptedData": "base64encoded...",
    "timestamp": 1744780900000,
    "version": 7
  }
}
```

Or if no update:
```json
{
  "success": true,
  "hasUpdate": false
}
```

---

## Error Handling

### Error Event

**Direction**: Server → Client

**Payload**:
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many updates",
  "details": {
    "limit": 30,
    "window": "1m",
    "retryAfter": 30
  }
}
```

### Error Codes

| Code | Description | HTTP Equivalent |
|------|-------------|-----------------|
| `INVALID_ROOM_ID` | Room ID format is invalid | 400 |
| `ROOM_NOT_FOUND` | Room does not exist | 404 |
| `NOT_IN_ROOM` | Client not a room member | 403 |
| `INVALID_PAYLOAD` | Message format is invalid | 400 |
| `PAYLOAD_TOO_LARGE` | Content exceeds size limit | 413 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `ENCRYPTION_REQUIRED` | Encrypted data missing | 400 |
| `SERVER_ERROR` | Internal server error | 500 |

---

## Chunk Transfer Protocol

For content larger than 50KB, the client automatically splits content into chunks.

### Sequence Diagram

```
Client                              Server
  │                                   │
  │  1. chunk (index: 0, total: 3)   │
  │─────────────────────────────────>│
  │                                   │
  │  2. chunk-ack (index: 0)         │
  │<─────────────────────────────────│
  │                                   │
  │  3. chunk (index: 1, total: 3)   │
  │─────────────────────────────────>│
  │                                   │
  │  4. chunk-ack (index: 1)         │
  │<─────────────────────────────────│
  │                                   │
  │  5. chunk (index: 2, total: 3)   │
  │─────────────────────────────────>│
  │                                   │
  │  6. ack (all chunks received)    │
  │<─────────────────────────────────│
  │                                   │
  │  7. Reassemble & Forward         │
  │                                   │────────► Other Clients
```

### Chunk Size

- Default: 50KB per chunk
- Maximum: 5MB total content size
- Timeout: 30 seconds for complete transfer

---

## Rate Limiting

### Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Updates (push-update) | 30 | 1 minute |
| Sync requests | 60 | 1 minute |
| Join attempts | 10 | 1 minute |

### Headers

After each event, the server may include rate limit information:

```json
{
  "rateLimit": {
    "limit": 30,
    "remaining": 25,
    "resetAt": 1744780860000
  }
}
```

---

## Client Implementation Example

```javascript
class SyncClient {
  constructor(serverUrl) {
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to sync server');
    });
    
    this.socket.on('sync-update', (data) => {
      this.handleSyncUpdate(data);
    });
    
    this.socket.on('error', (error) => {
      console.error('Sync error:', error);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from sync server');
    });
  }
  
  joinChain(roomId, deviceName) {
    return new Promise((resolve) => {
      this.socket.emit('join-chain', { roomId, deviceName }, (response) => {
        resolve(response);
      });
    });
  }
  
  pushUpdate(roomId, encryptedData, version) {
    return new Promise((resolve) => {
      this.socket.emit('push-update', {
        roomId,
        encryptedData,
        timestamp: Date.now(),
        version,
        deviceId: this.deviceId
      }, (response) => {
        resolve(response);
      });
    });
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}
```

---

## See Also

- [REST API Reference](./rest-api.md)
- [Architecture Overview](../en/architecture.md)
- [Security & Synchronization](../en/security-sync.md)

---

*Last updated: 2026-04-16*
