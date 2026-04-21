---
layout: default
title: Security & Synchronization
description: End-to-end encryption, room joining, sync broadcasting, conflict handling, and server protection boundaries
permalink: /docs/en/security-sync/
lang: en
---

# Security & Synchronization

Note Sync Now's core value is not just "real-time sync," but "sync collaboration without giving plaintext to the server." This page explains the security boundaries and sync main link in the current implementation.

---

## End-to-End Encryption Boundaries

The system follows the principle of "client-side encryption, server-side ciphertext relay."

### Client Responsibilities

- Mnemonic-based key derivation
- Content encryption and decryption
- Conflict judgment after receiving remote updates
- Local history and state updates

Related code:
- `apps/web/src/hooks/useSocket.js`
- `apps/web/src/utils/crypto`
- `apps/web/src/store/useStore.js`

### Server Responsibilities

- Room member management
- Sync event distribution
- Data format, size, and rate limiting
- Ciphertext payload persistence
- Health checks and statistics

Related code:
- `apps/api/index.js`
- `apps/api/src/persistence/PersistenceAdapter.js`
- `apps/api/src/persistence/PersistenceManager.js`

The server does not handle plaintext editing logic and should not rely on client content semantics for collaboration processing.

---

## Cryptographic Implementation

### Key Derivation

```javascript
// Pseudocode of key derivation process
function deriveKey(mnemonic) {
  // Step 1: Derive room salt from mnemonic
  const salt = SHA256("notesync-salt:" + mnemonic);
  
  // Step 2: PBKDF2 key derivation
  // Iterations: 10,000 (increased from 1,000 in v2.0.1)
  const key = PBKDF2(mnemonic, salt, iterations: 10000, keyLength: 256);
  
  return key;
}
```

### Encryption Algorithm

- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits
- **Mode**: GCM (Galois/Counter Mode) with authentication
- **Salt Derivation**: SHA-256 of mnemonic with prefix

### Security Properties

| Property | Implementation |
|----------|----------------|
| Confidentiality | AES-256 encryption |
| Integrity | GCM authentication tag |
| Key uniqueness | Mnemonic-derived unique keys |
| Forward secrecy | New keys for each sync chain |

---

## Key Synchronization Flows

### 1. Joining a Sync Chain

After client calls `joinChain`:

1. Derive room and encryption information from mnemonic
2. Establish Socket connection
3. Send `join-chain` event with `roomId` and device name
4. Server validates room ID format
5. Server adds socket to corresponding room
6. If historical ciphertext exists, server immediately returns `sync-update`
7. Server broadcasts latest `room-info`

### 2. Pushing Updates

After user edits content:

1. Client applies debouncing to content
2. Content is split into chunks if large
3. Client encrypts and emits `push-update`
4. Server validates membership, data format, and volume
5. Server writes to persistence or memory layer
6. Server broadcasts `sync-update` to other room members
7. Server returns `update-ack` to sender

### 3. Reconnection and Proactive Sync

When network fluctuates or client recovers:

- Client listens for reconnection events and automatically resends `join-chain`
- Client can also proactively trigger `request-sync`
- Server prioritizes reading from persistence layer; falls back to memory if unavailable

---

## Conflict Handling

The current implementation is not simply "last write wins." The client integrates a conflict management module to handle cases where local unsynced modifications and remote new content appear simultaneously.

### Key Capabilities

- Compare local and remote content hash/version information
- Determine if concurrent editing or offline branching occurred
- Maintain pending conflict list
- Support manual conflict resolution and state cleanup

Core entry points:
- `brave-sync-notes/client/src/hooks/useSocket.js`
- `apps/web/src/utils/conflict`

### Conflict Resolution Flow

```
Local Edit ─────┐
                ├──► Compare Hashes ──► Different? ──► Conflict Detected
Remote Update ──┘                                      │
                                                       ▼
                                              [Conflict UI Shown]
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                        Keep Local               Keep Remote               Custom Merge
                              │                        │                        │
                              ▼                        ▼                        ▼
                        Overwrite with          Discard local            User-edited
                        local content           changes                  content
```

---

## Server Protection Boundaries

The server implements several direct protection measures:

### Input Validation

- Room ID must meet length and character format restrictions
- Update payloads must contain `encryptedData` as string type

### Access Control

- Only sockets that have joined a room can execute `push-update` to that room

### Size Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| Max payload size | 5MB | Prevent memory exhaustion |
| Chunk size | 50KB | Large content splitting threshold |
| Socket buffer | 10MB | Socket.IO maxHttpBufferSize |

### Rate Limiting

| Limit | Value | Scope |
|-------|-------|-------|
| Max updates | 30 per minute | Per socket |
| Burst allowance | 5 updates | Immediate window |

### Data Cleanup

- Chunk transfer sessions have timeout cleanup mechanisms
- Idle rooms without client connections are cleaned up by TTL
- When room count exceeds limit, oldest rooms without connections are evicted first

### Cleanup Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `ROOM_TTL_MS` | 3600000 (1 hour) | Room expiration time |
| `MAX_MEMORY_ROOMS` | 10000 | Maximum rooms in memory |
| Cleanup interval | 30 minutes | Background cleanup frequency |

---

## Runtime Observability

The server provides:

- `/health`: Basic health status, connection count, room count, persistence state
- `/stats`: Connection count, room count, memory usage, persistence statistics

These endpoints are suitable for development, deployment troubleshooting, and future CI/monitoring integration.

### Health Endpoint Response

```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T10:30:00.000Z",
  "connections": 5,
  "rooms": 3,
  "persistence": "connected",
  "primaryStorage": "redis",
  "fallbackStorage": "sqlite"
}
```

### Stats Endpoint Response

```json
{
  "connections": 5,
  "rooms": 3,
  "memory": {
    "used": 45.2,
    "total": 512,
    "unit": "MB"
  },
  "persistence": {
    "primary": {
      "type": "redis",
      "status": "connected",
      "keys": 42
    },
    "fallback": {
      "type": "sqlite",
      "status": "connected",
      "records": 128
    }
  }
}
```

---

## Threat Model

### Threats Addressed

| Threat | Mitigation |
|--------|------------|
| Server compromise | End-to-end encryption; server only sees ciphertext |
| Network eavesdropping | TLS for transport; already encrypted content |
| Replay attacks | Timestamps and version numbers |
| Rate limiting bypass | Per-socket rate limiting |
| Memory exhaustion | Payload size limits and room count caps |

### Threats NOT Addressed

| Threat | Reason |
|--------|--------|
| Client-side malware | Cannot protect against compromised client |
| Mnemonic theft | Key management is user's responsibility |
| Denial of service | Basic rate limiting; dedicated DDoS protection needed |

---

## Security Best Practices

### For Users

1. **Protect your mnemonic**: It is your only recovery method
2. **Use HTTPS**: Always deploy with TLS in production
3. **Verify room members**: Share mnemonics only with trusted parties
4. **Regular backups**: Export important notes periodically

### For Administrators

1. **Enable persistence**: Don't rely solely on memory mode
2. **Monitor health endpoints**: Set up alerts for anomalies
3. **Keep dependencies updated**: Regular `npm audit`
4. **Use strong Redis auth**: If using Redis, enable authentication

---

## Current Engineering Focus

Next priorities for security and sync enhancement:

1. Add more realistic path-based tests for `useSocket`
2. Add server-side join/sync/error main link tests
3. Integrate existing tests into CI as quality gates

---

## Recommended Reading Order

1. [Documentation Home](../)
2. [Quick Start Guide](./getting-started)
3. [Architecture Overview](./architecture)
4. Current page: Security & Synchronization
5. [Deployment Guide](./deployment)
6. [Contributing Guide](./contributing)
7. [Changelog](/changelog/)

---

*Last updated: 2026-04-16*
