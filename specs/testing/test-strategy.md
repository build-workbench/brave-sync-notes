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

#### Core Properties

| # | Property | Validates |
|---|----------|-----------|
| 1 | Encryption/Decryption Round-Trip Consistency | Security requirements |
| 2 | Server Restart Data Persistence | Reliability requirements |
| 3 | Conflict Detection Completeness | Conflict resolution requirements |
| 4 | Offline Queue Order Preservation | Offline mode requirements |
| 5 | Notebook Isolation | Multi-notebook requirements |
| 6 | History Version Delta Storage | Version history requirements |
| 7 | Backup/Restore Round-Trip Consistency | Backup requirements |
| 8 | Tag Search Completeness | Search and tag requirements |
| 9 | Export/Import Round-Trip Consistency | Import/export requirements |
| 10 | Device Revocation Effectiveness | Security enhancement requirements |

#### Detailed Property Definitions

##### Property 1: Encryption/Decryption Round-Trip Consistency

*For any* valid note content and encryption key, encrypting then decrypting must produce identical content.

**Validates:** Security requirements

**Test:**
```javascript
fc.assert(
  fc.property(fc.string(), fc.string({ minLength: 16 }), (content, key) => {
    const encrypted = encrypt(content, key);
    const decrypted = decrypt(encrypted, key);
    return decrypted === content;
  })
);
```

##### Property 2: Server Restart Data Persistence

*For any* saved sync chain data, server restart must restore complete data.

**Validates:** Reliability requirements (Req 1.1)

##### Property 3: Conflict Detection Completeness

*For any* two concurrent updates within 5 seconds, the system must detect the conflict and preserve both versions.

**Validates:** Conflict resolution requirements (Req 2.1)

##### Property 4: Offline Queue Order Preservation

*For any* sequence of offline operations, reconnection must sync in the original order.

**Validates:** Offline mode requirements (Req 4.3, 4.4)

##### Property 5: Notebook Isolation

*For any* two different notebooks, their notes, encryption keys, and sync chains must be completely independent.

**Validates:** Multi-notebook requirements (Req 3.1, 3.2)

##### Property 6: History Version Delta Storage

*For any* saved history version, only the delta from the previous version should be stored.

**Validates:** Version history requirements (Req 5.4)

##### Property 7: Backup/Restore Round-Trip Consistency

*For any* complete backup, restored data must match the original data exactly.

**Validates:** Backup requirements (Req 11.3)

##### Property 8: Tag Search Completeness

*For any* tag added to a note, filtering by that tag must return all notes containing it.

**Validates:** Search and tag requirements (Req 10.3, 10.4)

##### Property 9: Export/Import Round-Trip Consistency

*For any* exported notebook ZIP file, re-importing must contain all original notes and metadata.

**Validates:** Import/export requirements (Req 9.1, 9.2)

##### Property 10: Device Revocation Effectiveness

*For any* revoked device, that device must be unable to reconnect with the old key.

**Validates:** Security enhancement requirements (Req 7.5)

#### Refactor Properties (from RFC 0002)

| # | Property | Validates |
|---|----------|-----------|
| 11 | Storage Round-Trip Consistency | Req 1.3, 1.4 |
| 12 | Storage Fallback Data Preservation | Req 1.2 |
| 13 | Three-Way Merge Correctness | Req 2.4 |
| 14 | Note Unique Identifier | Req 4.1 |
| 15 | Note Switch Data Preservation | Req 4.2 |
| 16 | Note Sorting Correctness | Req 4.5 |
| 17 | History Version Limit | Req 5.5 |
| 18 | Version Restore Completeness | Req 5.4 |
| 19 | Version Increment Correctness | Req 7.2 |
| 20 | Data Validation Rejects Invalid Input | Req 7.4 |

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
cd apps/web && npm test -- --run

# Run server tests
cd apps/api && npm test

# Run property tests
cd apps/api && npm run test:property
```

## Continuous Integration

All tests must pass before:
- Code is committed to main branch
- New version is released
- Pull request is merged

## Writing New Property Tests

When adding new property tests, follow this format:

```javascript
describe('Property N: Property Name', () => {
  it('should satisfy the property description', () => {
    fc.assert(
      fc.property(
        // Arbitraries (input generators)
        fc.string(),
        fc.integer(),
        // Property function
        (input1, input2) => {
          // Test logic
          const result = functionUnderTest(input1, input2);
          // Assertion
          return /* boolean property */;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

---

## Related Documents

- [Product Requirements](../product/note-sync-system.md)
- [Core Architecture (RFC 0001)](../rfc/0001-core-architecture.md)
- [Comprehensive Refactor (RFC 0002)](../rfc/0002-comprehensive-refactor.md)
