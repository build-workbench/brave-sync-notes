---
layout: default
title: Frequently Asked Questions
description: Common questions and answers for Note Sync Now users
---

# Frequently Asked Questions (FAQ)

## General Questions

### Q: What if I lose my mnemonic phrase?

::: danger Cannot Recover
The mnemonic phrase is the only credential to recover your sync chain. If lost, you cannot recover it and need to create a new sync chain.
:::

**Prevention Measures:**
1. Back up to multiple secure locations immediately upon creation
2. Store in a password manager
3. Write down on paper

### Q: How many devices can be logged in simultaneously?

**Answer:** Unlimited.

Note Sync Now uses a zero-account design. Any device with the mnemonic phrase can join the sync chain. Note that:
- Recommended max 100 devices per room
- Device count affects sync performance

### Q: What is the sync latency?

**Typical Latency:**

| Network Condition | Latency Range |
|-------------------|---------------|
| Local network | < 50ms |
| Same region | 50-150ms |
| Cross-region | 150-500ms |
| Cross-continent | 500-1000ms |

### Q: Where is data stored?

**Storage Architecture:**

| Location | Stored Content | Encryption Status |
|----------|----------------|-------------------|
| Client IndexedDB | Note content, history | Plaintext (local) |
| Server Redis/SQLite | Encrypted data | Ciphertext |
| Server Memory | Encrypted data | Ciphertext |

::: tip Zero-Trust Architecture
Server never touches plaintext. All encryption is done client-side.
:::

## Encryption Related

### Q: Why choose AES-256-GCM?

**Answer:**

1. **Security**: NIST certified, military-grade encryption
2. **Authenticated Encryption**: Provides both confidentiality and integrity
3. **Performance**: Hardware acceleration support, suitable for large files
4. **Standardization**: Widely audited, no backdoor risk

### Q: Why is PBKDF2 iteration count 100,000?

**Answer:**

```
Cracking cost estimate:
- Single computation: ~1ms
- 100,000 iterations: ~100ms
- Try 100 million mnemonics: ~115 days (single machine)
- GPU acceleration: Still weeks
```

The iteration count is a balance between performance and security, can increase as hardware improves.

### Q: How secure is the mnemonic phrase?

**Security Strength:**

| Property | Value | Description |
|----------|-------|-------------|
| Entropy | 128 bits | 2^128 possible combinations |
| Wordlist size | 2048 words | BIP39 standard |
| Brute force | Infeasible | Beyond current computing power |

## Sync Related

### Q: How are conflicts resolved?

**Three-Way Merge Algorithm:**

```
Base version: "Hello"
Local version: "Hello World"
Remote version: "Hello!"

Merge result: "Hello World!" (no conflict)
              or mark conflict regions (has conflict)
```

### Q: Will offline edits be lost?

**No.** Offline edits are stored in IndexedDB and automatically synced when network recovers.

Limitations:
- Max 100 offline updates cached
- Same note keeps only latest version

### Q: How are large files handled?

**Chunked Transfer Mechanism:**

| Size | Handling Method |
|------|-----------------|
| < 100 KB | Direct transfer |
| 100 KB - 5 MB | Auto chunked transfer |
| > 5 MB | Transfer rejected |

## Deployment Related

### Q: What deployment method is recommended?

| Scenario | Recommended Solution |
|----------|---------------------|
| Personal use | Docker single container |
| Team use | Docker Compose + Redis |
| Production | Kubernetes + Redis Cluster |

### Q: How to choose between Redis and SQLite?

| Comparison | Redis | SQLite |
|------------|-------|--------|
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Persistence | Configurable | Native |
| Deployment complexity | Medium | Simple |
| Horizontal scaling | Supported | Not supported |
| Use case | High-concurrency production | Small-scale deployment |

### Q: How to backup data?

**Server Backup:**

```bash
# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/

# SQLite backup
cp data/sync.db /backup/sync-$(date +%Y%m%d).db
```

**Client Backup:**
- Export notes as Markdown/text files
- Save mnemonic phrase to secure location

## Security Related

### Q: Can the server see my notes?

**No.** End-to-end encryption design ensures:

1. Encryption completed client-side
2. Server only stores ciphertext
3. Server has no decryption key

### Q: What if the server is attacked?

**Impact Analysis:**

| Attack Type | Impact | Protection |
|-------------|--------|------------|
| Data breach | None | Data is encrypted |
| Service disruption | Temporarily cannot sync | Offline functionality normal |
| Code tampering | Requires user trust | Open source auditable |

### Q: How to ensure client code security?

**Verification Methods:**

1. **Source audit**: Project is fully open source
2. **Self-build**: Build Docker image from source
3. **Network analysis**: Inspect WebSocket traffic (ciphertext)

---

More questions? [Submit an Issue](https://github.com/AICL-Lab/brave-sync-notes/issues) or check the [Troubleshooting Guide](/en/troubleshooting).
