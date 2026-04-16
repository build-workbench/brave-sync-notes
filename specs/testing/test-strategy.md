# Testing Strategy

> **Status:** Active  
> **Created:** 2026-04-17  
> **Last Updated:** 2026-04-17

## Overview

This document defines the testing strategy for the Note Sync Now system, including test frameworks, coverage targets, and correctness properties.

## Test Frameworks

| Type | Tool | Purpose |
|------|------|---------|
| Unit Tests | Vitest (Client) / Jest (Server) | Functional verification |
| Property Tests | fast-check | Invariant validation |
| Integration Tests | Playwright | End-to-end testing |

## Configuration

### Vitest Configuration

```javascript
// vitest.config.js
export default {
  test: {
    include: ['**/*.property.test.{js,ts}'],
    testTimeout: 30000, // Property tests need more time
  }
};
```

### fast-check Configuration

```javascript
const fcConfig = {
  numRuns: 100,  // Run each property 100 times
  seed: Date.now(),
  verbose: true
};
```

## Test Categories

### 1. Property-Based Tests

Property-based tests verify that certain properties hold true for all valid inputs.

#### Property 1: Encryption/Decryption Round-Trip Consistency
*For any* valid note content and encryption key, encrypting then decrypting must produce identical content.
**Validates:** Security requirements

#### Property 2: Server Restart Data Persistence
*For any* saved sync chain data, server restart must restore complete data.
**Validates:** Reliability requirements

#### Property 3: Conflict Detection Completeness
*For any* two concurrent updates within 5 seconds, the system must detect the conflict and preserve both versions.
**Validates:** Conflict resolution requirements

#### Property 4: Offline Queue Order Preservation
*For any* sequence of offline operations, reconnection must sync in the original order.
**Validates:** Offline mode requirements

#### Property 5: Notebook Isolation
*For any* two different notebooks, their notes, encryption keys, and sync chains must be completely independent.
**Validates:** Multi-notebook requirements

#### Property 6: History Version Delta Storage
*For any* saved history version, only the delta from the previous version should be stored.
**Validates:** Version history requirements

#### Property 7: Backup/Restore Round-Trip Consistency
*For any* complete backup, restored data must match the original data exactly.
**Validates:** Backup requirements

#### Property 8: Tag Search Completeness
*For any* tag added to a note, filtering by that tag must return all notes containing it.
**Validates:** Search and tag requirements

#### Property 9: Export/Import Round-Trip Consistency
*For any* exported notebook ZIP file, re-importing must contain all original notes and metadata.
**Validates:** Import/export requirements

#### Property 10: Device Revocation Effectiveness
*For any* revoked device, that device must be unable to reconnect with the old key.
**Validates:** Security enhancement requirements

### 2. Unit Tests

Unit tests verify individual component behavior.

#### Storage Layer
- IndexedDB operations
- LocalStorage fallback
- Data serialization/deserialization
- Quota management

#### Conflict Resolution
- Conflict detection algorithms
- Three-way merge
- Strategy selection

#### Sync Engine
- Operation transformation
- Version tracking
- State management

#### Crypto Module
- Key derivation
- Encryption/decryption
- Key rotation

### 3. Integration Tests

Integration tests verify component interactions.

#### WebSocket Connection Flow
- Connection establishment
- Room joining
- Message broadcasting
- Disconnection handling

#### Multi-Device Sync Scenarios
- Concurrent edits
- Conflict detection
- Resolution workflow

#### Offline/Online Transition
- Offline queuing
- Reconnection sync
- Conflict handling

## Coverage Targets

| Module | Target |
|--------|--------|
| Crypto Module | 95% |
| Storage Module | 90% |
| Sync Engine | 85% |
| UI Components | 70% |
| **Overall** | **80%** |

## Test Execution

```bash
# Run all tests
npm test

# Run client tests
cd brave-sync-notes/client && npm test -- --run

# Run server tests
cd brave-sync-notes/server && npm test

# Run property tests
cd brave-sync-notes/server && npm run test:property
```

## Continuous Integration

All tests must pass before:
- Code is committed to main branch
- New version is released
- Pull request is merged

---

## Related Documents

- [Product Requirements](../product/note-sync-system.md)
- [Core Architecture](../rfc/0001-core-architecture.md)
