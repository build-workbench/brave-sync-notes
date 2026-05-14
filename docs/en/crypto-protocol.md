---
layout: default
title: Encryption Protocol
description: End-to-end encryption protocol, key derivation, and security assumptions for Note Sync Now.
permalink: /docs/en/crypto-protocol/
lang: en
---

# Encryption Protocol

This document details the design and implementation of Note Sync Now's end-to-end encryption protocol.

## Protocol Overview

```mermaid
graph TB
    subgraph Initialization Phase
        A[User enters mnemonic] --> B[BIP39 parsing]
        B --> C[Generate seed]
        C --> D[PBKDF2 key derivation]
    end

    subgraph Encryption Phase
        E[Plaintext note] --> F[Generate IV]
        F --> G[AES-256-GCM encryption]
        D --> G
        G --> H[Ciphertext + Auth Tag]
    end

    subgraph Transmission Phase
        H --> I[Base64 encoding]
        I --> J[WebSocket transmission]
    end

    D --> E
```

## Key Derivation

### BIP39 Mnemonic

```mermaid
sequenceDiagram
    actor User as User
    participant App as Application
    participant Crypto as Web Crypto API

    Note over User, Crypto: Create new sync chain
    App->>Crypto: Generate 128-bit entropy
    Crypto-->>App: Random bytes
    App->>App: Split into 12 parts
    App->>App: Map to word list
    App-->>User: Display 12 words

    Note over User, Crypto: Restore sync chain
    User->>App: Enter 12 words
    App->>App: Validate word validity
    App->>App: Compute checksum
    App->>Crypto: Generate seed
```

**Mnemonic Properties**:

| Property | Value | Description |
|----------|-------|-------------|
| Word count | 12 | BIP39 standard |
| Entropy | 128 bits | Security strength |
| Checksum | 4 bits | Input error detection |
| Word list | BIP39 EN | 2048 words |

### PBKDF2 Key Derivation

```typescript
// Key derivation pseudocode
async function deriveKey(mnemonic: string, roomId: string): Promise<CryptoKey> {
  // 1. Mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic)

  // 2. PBKDF2 derivation
  const key = await crypto.subtle.importKey(
    'raw',
    seed,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(roomId),
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return derivedKey
}
```

**Derivation Parameters**:

| Parameter | Value | Security Consideration |
|-----------|-------|------------------------|
| Iterations | 100,000 | GPU brute-force resistance |
| Hash function | SHA-256 | Standard secure hash |
| Salt | roomId | Room isolation |
| Output length | 256 bits | AES-256 key |

### Room ID Generation

```mermaid
flowchart LR
    A[Mnemonic] --> B[BIP39 Seed]
    B --> C[SHA-256]
    C --> D[First 16 bytes]
    D --> E[Hex encoding]
    E --> F[32-char roomId]

    style A fill:#e3f2fd
    style F fill:#c8e6c9
```

## Encryption Algorithm

### AES-256-GCM

```mermaid
sequenceDiagram
    participant App as Application
    participant Crypto as Web Crypto API

    Note over App, Crypto: Encryption flow
    App->>Crypto: Generate 96-bit IV
    App->>Crypto: encrypt(plaintext, key, iv, aad)
    Crypto->>Crypto: AES-256-GCM
    Crypto-->>App: ciphertext + 128-bit tag

    Note over App, Crypto: Decryption flow
    App->>Crypto: decrypt(ciphertext, key, iv, tag, aad)
    Crypto->>Crypto: Verify tag
    alt tag valid
        Crypto-->>App: plaintext
    else tag invalid
        Crypto-->>App: Error (tampering detected)
    end
```

**Algorithm Parameters**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | AES-256-GCM | Authenticated encryption |
| Key length | 256 bits | High security strength |
| IV length | 96 bits | Standard recommendation |
| Tag length | 128 bits | Integrity protection |
| AAD | roomId | Room binding |

### Encryption Implementation

```typescript
// Encryption pseudocode
async function encrypt(content: string, key: CryptoKey, roomId: string): Promise<EncryptedData> {
  // 1. Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 2. Encode plaintext
  const encoded = new TextEncoder().encode(content)

  // 3. AES-GCM encryption
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: new TextEncoder().encode(roomId)
    },
    key,
    encoded
  )

  // 4. Return structured data
  return {
    iv: base64Encode(iv),
    data: base64Encode(ciphertext.slice(0, -16)),  // ciphertext
    tag: base64Encode(ciphertext.slice(-16)),      // auth tag
    roomId: roomId
  }
}
```

### Decryption Implementation

```typescript
// Decryption pseudocode
async function decrypt(encrypted: EncryptedData, key: CryptoKey): Promise<string> {
  // 1. Decode Base64
  const iv = base64Decode(encrypted.iv)
  const ciphertext = concat(
    base64Decode(encrypted.data),
    base64Decode(encrypted.tag)
  )

  // 2. AES-GCM decryption
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: new TextEncoder().encode(encrypted.roomId)
    },
    key,
    ciphertext
  )

  // 3. Decode plaintext
  return new TextDecoder().decode(plaintext)
}
```

## Security Properties

### Confidentiality

```mermaid
graph LR
    A[Plaintext] -->|Encrypt| B[Ciphertext]
    B -->|Transmit| C[Server]
    C -->|Store| D[Ciphertext Storage]

    E[Attacker] -.->|Only sees| D
    D -.->|Cannot decrypt| E

    style A fill:#c8e6c9
    style D fill:#ffcdd2
    style E fill:#ffcdd2
```

**Guarantee**: An attacker without the key cannot recover plaintext from ciphertext.

### Integrity

```mermaid
sequenceDiagram
    participant Client as Client
    participant Attacker as Attacker
    participant Server as Server

    Client->>Server: Ciphertext + Tag

    Note over Attacker: Tampering attempt
    Attacker->>Server: Tampered ciphertext + Tag

    Note over Server: Server forwards
    Server->>Client: Tampered ciphertext + Tag

    Client->>Client: GCM verification
    Client-->>Client: Tampering detected, discard
```

**Guarantee**: Any tampering with ciphertext will be detected, decryption will fail.

### Authentication

Room ID binding via AAD (Additional Authenticated Data):

```typescript
// Bind room during encryption
additionalData: new TextEncoder().encode(roomId)

// Verify room during decryption
// If roomId doesn't match, decryption fails
```

**Guarantee**: Ciphertext cannot be used across rooms.

## Security Assumptions

### Cryptographic Assumptions

| Assumption | Description | Dependency |
|------------|-------------|------------|
| AES-GCM security | AES-GCM is IND-CCA2 secure | Standard assumption |
| PBKDF2 security | High iterations make brute-force infeasible | Computational complexity |
| Random number security | IV generator is cryptographically secure | Web Crypto API |

### Implementation Assumptions

| Assumption | Description | Risk |
|------------|-------------|------|
| Web Crypto API correct | Browser implementation has no vulnerabilities | Low |
| Mnemonic secrecy | User doesn't leak mnemonic | User responsibility |
| Client security | Client code hasn't been tampered with | User responsibility |

### Threat Exclusion

```mermaid
graph TB
    A[Threat] --> B{In scope?}
    B -->|Yes| C[Protocol protection]
    B -->|No| D[Exclusion note]

    E[Network eavesdropping] --> B
    F[Server breach] --> B
    G[Man-in-the-middle] --> B

    H[Client malware] --> I[Excluded: User responsibility]
    J[Mnemonic leak] --> K[Excluded: User responsibility]
    L[Physical access] --> M[Excluded: User responsibility]

    style C fill:#c8e6c9
    style D fill:#fff9c4
```

## Protocol Limitations

### Known Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| No forward secrecy | Key doesn't change | User can regenerate mnemonic |
| No perfect forward secrecy | Relies on computational complexity | High iteration count |
| Single key | One key per room | Room isolation |

### Threats Not Protected

::: warning User Responsibility
The following threats require user self-protection:

1. **Mnemonic leakage**: Do not share mnemonic in insecure environments
2. **Client malware**: Use trusted clients
3. **Physical access**: Protect device physical security
:::

## Implementation Reference

### Key Files

| File | Function |
|------|----------|
| `apps/web/src/utils/crypto/index.js` | Encryption module entry |
| `apps/web/src/utils/crypto/encrypt.js` | Encryption implementation |
| `apps/web/src/utils/crypto/decrypt.js` | Decryption implementation |
| `apps/web/src/utils/crypto/keyDerivation.js` | Key derivation |

### Dependencies

| Library | Purpose | Version |
|---------|---------|---------|
| bip39 | Mnemonic handling | latest |
| Web Crypto API | Encryption primitives | Browser built-in |

---

::: tip Security Audit
This protocol design references best practices from Signal Protocol and Wire Protocol. Professional security audit is recommended before production deployment.
:::
