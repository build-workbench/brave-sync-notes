---
layout: default
title: Architecture Overview
description: System boundaries, core modules, and synchronization data flow overview for Note Sync Now
permalink: /docs/en/architecture/
lang: en
---

# Architecture Overview

Note Sync Now consists of a React + Vite client, an Express + Socket.IO server, and a GitHub Pages documentation site. The system design follows the principle of "client-side encryption and recovery, server-side relay and persistence."

---

## Overall Architecture Layers

### Client Layer

- **React**: Handles user interface and interactions
- **Zustand**: Manages local state
- **`useSocket`**: Manages real-time synchronization
- **`crypto` module**: Handles key derivation, encryption, and decryption
- **Conflict management**: Processes differences between local and remote content
- **Local storage**: Handles IndexedDB / LocalStorage capabilities

Key files:
- `apps/web/src/App.jsx`
- `apps/web/src/hooks/useSocket.js`
- `apps/web/src/store/useStore.js`
- `apps/web/src/utils/crypto`
- `apps/web/src/utils/conflict`
- `apps/web/src/utils/storage`

### Server Layer

- **Express**: Exposes health check and statistics endpoints
- **Socket.IO**: Handles room joining, sync broadcasts, error feedback, and member lists
- **`PersistenceManager`**: Manages persistence adapters
- **Redis / SQLite**: Configurable storage backends
- **In-memory Map**: Fallback storage when other options are unavailable

Key files:
- `apps/api/index.js`
- `apps/api/src/persistence/PersistenceManager.js`
- `apps/api/src/persistence/PersistenceAdapter.js`

---

## Core Architecture Principles

1. **End-to-End Encryption First**: Note content is encrypted on the client side; the server only receives ciphertext.

2. **Mnemonic-Driven Recovery**: The client derives room and encryption information from the mnemonic phrase.

3. **Server as Stateless as Possible**: The server focuses on sync forwarding, short-term in-memory state, and persistence fallback.

4. **Explicit Conflict Handling**: When local edits conflict with remote updates, not all cases are simplified to overwrite.

5. **Multi-Layer Storage Degradation**: Prioritize persistent storage; fall back to memory mode when unavailable.

---

## Synchronization Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client A  │     │   Server    │     │   Client B  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Edit Content  │                   │
       │──────────────────>│                   │
       │                   │                   │
       │  2. Encrypt       │                   │
       │  3. Chunk (if >50KB)                  │
       │                   │                   │
       │  4. push-update   │                   │
       │──────────────────>│                   │
       │                   │  5. Validate      │
       │                   │  6. Persist       │
       │                   │                   │
       │                   │  7. sync-update   │
       │                   │──────────────────>│
       │                   │                   │  8. Decrypt
       │                   │                   │  9. Conflict check
       │                   │                   │
       │  10. update-ack   │                   │
       │<──────────────────│                   │
       │                   │                   │
```

### Detailed Flow

1. User edits content on the client
2. Zustand updates current note state
3. `useSocket` encrypts content and splits into chunks if needed
4. Client sends ciphertext to server via `push-update`
5. Server validates room membership, data format, size, and rate limits
6. Server saves latest ciphertext to persistence or memory fallback
7. Server broadcasts update to other room members via `sync-update`
8. Receiving client decrypts data and enters conflict detection if needed

---

## Key Module Relationships

### Client Sync Engine

`useSocket.js` is the main client-side sync entry point, responsible for:

- Creating and maintaining Socket connections
- Initial `joinChain` call
- Rejoining after disconnection
- Decrypting remote `sync-update` and saving to storage
- `requestSync` for proactive fetching
- Throttled history saving
- Conflict manager invocation

### Server Event Model

Key events in `server/index.js` include:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-chain` | C → S | Join sync chain and return existing data |
| `push-update` | C → S | Submit latest ciphertext update |
| `request-sync` | C → S | Request latest state after reconnection |
| `sync-update` | S → C | Broadcast update to room members |
| `room-info` | S → C | Broadcast room member information |
| `update-ack` | S → C | Confirm server received update |
| `error` | S → C | Return parameter, permission, or rate limit errors |

---

## Data Encryption Flow

```
User Content
     │
     ▼
[Client: Zustand Store]
     │
     ▼
[Client: Encryption]
  - Derive key from mnemonic
  - AES-256-GCM encryption
     │
     ▼
[Client: Chunking] (if > 50KB)
     │
     ▼
[Network: WebSocket]
     │
     ▼
[Server: Validation]
  - Room membership
  - Data format
  - Size check
  - Rate limiting
     │
     ▼
[Server: Persistence]
  - Redis (primary)
  - SQLite (fallback)
  - Memory (last resort)
```

---

## Current Implementation Focus

Based on the existing design documentation and code implementation, this project currently focuses on:

- Stable end-to-end sync main link
- Conflict detection and manual resolution integration
- Server-side persistence and fallback strategies
- Extensibility for future multi-note support, offline queues, and enhanced local storage

---

## Recommended Reading Order

1. [Documentation Home](../)
2. [Quick Start Guide](./getting-started)
3. Current page: Architecture Overview
4. [Deployment Guide](./deployment)
5. [Security & Synchronization](./security-sync)
6. [Contributing Guide](./contributing)
7. [Changelog](/changelog/)

---

*Last updated: 2026-04-16*
