---
layout: default
title: Technical Specification
description: Complete technical specifications and design constraints for Note Sync Now.
permalink: /docs/en/tech-spec/
lang: en
---

# Technical Specification

This document defines the technical specifications, performance metrics, and design constraints for Note Sync Now.

## System Requirements

### Client

| Item | Minimum | Recommended |
|------|---------|-------------|
| Browser | Chrome 90+, Firefox 88+, Safari 14+ | Latest stable version |
| Memory | 256 MB available | 512 MB+ |
| Storage | 50 MB IndexedDB | 200 MB+ |
| Network | Stable connection | WebSocket support |

### Server

| Item | Minimum | Recommended |
|------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| Memory | 512 MB | 2 GB+ |
| Storage | 1 GB | 10 GB+ (depends on user volume) |
| Redis | 6.x (optional) | 7.x |

## Performance Specifications

### Sync Latency

```mermaid
graph LR
    A[User Input] -->|< 50ms| B[Local Update]
    B -->|< 100ms| C[Encryption Complete]
    C -->|< 200ms| D[Server Acknowledged]
    D -->|< 100ms| E[Broadcast Delivered]

    style A fill:#e3f2fd
    style E fill:#c8e6c9
```

| Metric | Target | Measurement |
|--------|--------|-------------|
| Local update latency | < 50ms | Input to UI update |
| Encryption time | < 100ms | Encrypt 1MB content |
| Network round-trip | < 200ms | Client to server |
| End-to-end sync | < 500ms | Input to remote display |

### Throughput

| Scenario | Metric |
|----------|--------|
| Per-room concurrency | 100+ devices |
| Per-server connections | 10,000+ WebSocket |
| Update throughput | 1,000 updates/sec |
| Max content size | 5 MB / update |

## Encryption Specifications

### Key Derivation

```mermaid
flowchart TB
    A[Mnemonic<br/>12 words] --> B[BIP39<br/>Mnemonic → Seed]
    B --> C[Seed<br/>512 bits]
    C --> D[PBKDF2]
    D --> E[Salt: roomId]
    D --> F[Iterations: 100,000]
    D --> G[Key: 256 bits]

    style A fill:#e3f2fd
    style G fill:#c8e6c9
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| Mnemonic length | 12 words | 128-bit entropy |
| PBKDF2 iterations | 100,000 | Brute-force resistance |
| Derived key length | 256 bits | AES-256 |
| Salt | roomId | Room isolation |

### Encryption Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | AES-256-GCM | Authenticated encryption |
| IV length | 96 bits | Standard length |
| Tag length | 128 bits | Integrity protection |
| Associated data | roomId | Additional binding |

## Sync Specifications

### Message Format

```typescript
// WebSocket message types
interface JoinChain {
  event: 'join-chain'
  roomId: string      // 32-character hexadecimal
  deviceName: string  // 1-50 characters
}

interface PushUpdate {
  event: 'push-update'
  roomId: string
  encryptedData: string  // Base64-encoded ciphertext
  chunkIndex?: number    // Chunk index (optional)
  totalChunks?: number   // Total chunks (optional)
}

interface SyncUpdate {
  event: 'sync-update'
  encryptedData: string
  fromDevice: string
  timestamp: number
}

interface UpdateAck {
  event: 'update-ack'
  success: boolean
  timestamp: number
}
```

### Chunking Strategy

```mermaid
flowchart TB
    A[Content Size] --> B{> 100 KB?}
    B -->|No| C[Single Chunk Transfer]
    B -->|Yes| D[Chunked Processing]
    D --> E[Chunk Size: 100 KB]
    D --> F[Sequential Send]
    F --> G[Server Reassembly]

    style C fill:#c8e6c9
    style G fill:#c8e6c9
```

| Parameter | Value |
|-----------|-------|
| Chunk threshold | 100 KB |
| Chunk size | 100 KB |
| Max total size | 5 MB |
| Chunk timeout | 30 seconds |

### Conflict Detection

```mermaid
sequenceDiagram
    participant L as Local
    participant S as Server
    participant R as Remote

    Note over L, R: Concurrent editing scenario
    L->>S: push-update (v1)
    R->>S: push-update (v1)

    Note over S: Sequential processing
    S-->>L: update-ack
    S->>R: sync-update (from L)

    Note over R: Received L's update
    R->>R: Local unpushed changes?
    R->>S: push-update (v2, based on v1)

    Note over S: Broadcast L's update
    S->>L: sync-update (from R)

    Note over L: Conflict detected
    L->>L: Three-way merge
```

## Storage Specifications

### Client Storage

| Storage | Purpose | Size Limit |
|---------|---------|------------|
| IndexedDB | Note content, history | Browser quota |
| LocalStorage | Settings, key cache | ~5 MB |
| SessionStorage | Temporary state | ~5 MB |

### Server Storage

```mermaid
graph TB
    A[Persistence Manager] --> B{Config Type}
    B -->|Redis| C[Redis Adapter]
    B -->|SQLite| D[SQLite Adapter]
    B -->|None| E[Memory Adapter]

    C --> F[High Performance]
    D --> G[Easy Deployment]
    E --> H[Dev/Test Only]

    style F fill:#c8e6c9
    style G fill:#fff9c4
    style H fill:#ffcdd2
```

| Storage Backend | Use Case | Persistent |
|-----------------|----------|------------|
| Redis | Production, high concurrency | ✅ |
| SQLite | Small-scale deployment | ✅ |
| Memory | Development & testing | ❌ |

## Server Protection Specifications

### Input Validation

```typescript
// Validation rules
const validators = {
  roomId: /^[a-f0-9]{32}$/,           // 32-character hexadecimal
  deviceName: /^.{1,50}$/,            // 1-50 characters
  encryptedData: /^.{1,7000000}$/,    // Base64, < 5MB raw
}
```

### Rate Limiting

| Limit Type | Threshold | Window |
|------------|-----------|--------|
| Update rate | 30 requests | 1 minute |
| Connection rate | 10 requests | 1 minute |
| Room creation | 5 requests | 1 hour |

### Resource Limits

| Resource | Limit | Overflow Handling |
|----------|-------|-------------------|
| Room count | 10,000 | LRU eviction |
| Devices per room | 100 | Reject join |
| Room idle TTL | 24 hours | Auto cleanup |

## Scalability Specifications

### Horizontal Scaling

```mermaid
graph TB
    subgraph Load Balancer
        LB[Load Balancer]
    end

    subgraph Service Instances
        S1[Server 1]
        S2[Server 2]
        S3[Server N]
    end

    subgraph Shared Storage
        Redis[(Redis Cluster)]
    end

    LB --> S1
    LB --> S2
    LB --> S3

    S1 <--> Redis
    S2 <--> Redis
    S3 <--> Redis
```

### Extension Points

| Extension Point | Current Status | Extension Method |
|-----------------|---------------|------------------|
| Multi-note | Architecture reserved | State management extension |
| Version history | Persistence supported | Add version field |
| Collaboration permissions | Not implemented | Permission model design |
| End-to-end testing | Partial | Test coverage improvement |

## Compatibility Specifications

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebSocket | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| IndexedDB | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| Web Crypto | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| ES Modules | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |

### API Stability

| API | Stability | Change Policy |
|-----|-----------|---------------|
| WebSocket events | Stable | Semantic versioning |
| REST endpoints | Stable | Semantic versioning |
| Message format | Stable | Backward compatible |
| Config format | Stable | Backward compatible |

---

::: tip Version Note
This specification corresponds to v2.2.0. Future version changes will update this document.
:::
