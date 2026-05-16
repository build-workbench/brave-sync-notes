---
layout: default
title: Academic References
description: Academic papers and standards referenced in the design of Note Sync Now
---

# Academic References

This document lists the academic papers, technical standards, and related projects referenced in the design of Note Sync Now.

## Cryptography Standards

### BIP39 - Mnemonic Generation

> **Bitcoin Improvement Proposal 39**  
> Mnemonic code for generating deterministic keys

```bibtex
@misc{bip39,
  author = {Marek Palatinus and Pavol Rusnak and Aaron Voisine and Sean Bowe},
  title = {BIP-39: Mnemonic code for generating deterministic keys},
  year = {2013},
  url = {https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki}
}
```

**Usage in Note Sync Now:**
- 12-word mnemonic phrase generation
- Cross-device recovery mechanism
- Human-readable key representation

### PBKDF2 - RFC 2898

> **RFC 2898: PKCS #5: Password-Based Cryptography Specification Version 2.0**

```bibtex
@rfc{rfc2898,
  author = {Burt Kaliski},
  title = {PKCS #5: Password-Based Cryptography Specification Version 2.0},
  series = {Request for Comments},
  number = {2898},
  year = {2000},
  publisher = {RFC Editor},
  doi = {10.17487/RFC2898}
}
```

**Implementation Parameters:**
- Iterations: 100,000
- Hash function: SHA-256
- Output: 256-bit key

### AES-GCM - NIST SP 800-38D

> **NIST Special Publication 800-38D**  
> Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)

```bibtex
@techreport{nist800-38d,
  author = {Morris Dworkin},
  title = {Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC},
  institution = {National Institute of Standards and Technology},
  year = {2007},
  number = {SP 800-38D},
  doi = {10.6028/NIST.SP.800-38D}
}
```

**Security Properties:**
- Confidentiality + Integrity (Authenticated Encryption)
- 128-bit authentication tag
- Additional Authenticated Data (AAD) support

## Sync Algorithms

### CRDTs

> **Conflict-free Replicated Data Types**

```bibtex
@inproceedings{crdts,
  author = {Marc Shapiro and Nuno Pregui\c{c}a and Carlos Baquero and Marek Zawirski},
  title = {Conflict-free Replicated Data Types},
  booktitle = {Proceedings of the 13th International Symposium on Stabilization, Safety, and Security of Distributed Systems},
  year = {2011},
  pages = {386--400},
  doi = {10.1007/978-3-642-24550-3_29}
}
```

**Relevance:**
- Alternative to three-way merge for complex scenarios
- Enables eventual consistency without coordination
- Used in Yjs, Automerge

### Operational Transformation

> **Operational Transformation in Collaborative Editing**

```bibtex
@article{ot,
  author = {C. Sun and C. Ellis},
  title = {Operational transformation in real-time group editors: issues, algorithms, and achievements},
  journal = {ACM Computing Surveys},
  volume = {40},
  number = {1},
  year = {2008},
  doi = {10.1145/1322432.1322434}
}
```

**Relevance:**
- Foundation for Google Docs collaboration
- Requires central coordination server
- More complex than CRDTs for some operations

## Related Open Source Projects

| Project | Description | License | Relevance |
|---------|-------------|---------|-----------|
| [Standard Notes](https://github.com/standardnotes/app) | End-to-end encrypted notes | AGPL-3.0 | Encryption architecture reference |
| [Yjs](https://github.com/yjs/yjs) | CRDT framework | MIT | Conflict resolution algorithm |
| [Trilium Notes](https://github.com/zadam/trilium) | Hierarchical note system | AGPL-3.0 | Architecture design reference |
| [Joplin](https://github.com/laurent22/joplin) | Open source notes + sync | MIT | Sync mechanism reference |
| [Signal Protocol](https://github.com/signalapp/libsignal) | End-to-end encryption protocol | AGPL-3.0 | Modern E2EE best practices |
| [Automerge](https://github.com/automerge/automerge) | CRDT library | MIT | Alternative to Yjs |

## Security Research

### OWASP Guidelines

| Resource | Application |
|----------|-------------|
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | Security verification standard |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | Implementation best practices |
| [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Common vulnerability awareness |

### NIST Cybersecurity Framework

- **Identify**: Asset management, risk assessment
- **Protect**: Access control, encryption, data security
- **Detect**: Anomaly detection, monitoring
- **Respond**: Incident response planning
- **Recover**: Recovery planning, backups

## WebSocket & Real-time Communication

### RFC 6455 - WebSocket Protocol

```bibtex
@rfc{rfc6455,
  author = {I. Fette and A. Melnikov},
  title = {The WebSocket Protocol},
  series = {Request for Comments},
  number = {6455},
  year = {2011},
  publisher = {RFC Editor},
  doi = {10.17487/RFC6455}
}
```

### Socket.IO Protocol

- Real-time bidirectional event-based communication
- Automatic reconnection with backoff
- Room/namespace support for multiplexing

## Web Standards

### Web Cryptography API

> **W3C Recommendation**

```bibtex
@misc{webcrypto,
  author = {W3C},
  title = {Web Cryptography API},
  year = {2017},
  url = {https://www.w3.org/TR/WebCryptoAPI/}
}
```

**Usage:**
- `SubtleCrypto.encrypt()` / `decrypt()` for AES-GCM
- `SubtleCrypto.deriveKey()` for PBKDF2
- `SubtleCrypto.importKey()` for key management

### IndexedDB

> **W3C Recommendation**

- Browser-native NoSQL database
- Transaction support
- Index and query capabilities

## Further Reading

### Books

1. **"Serious Cryptography"** by Jean-Philippe Aumasson
   - Modern cryptographic primitives explained
   - Practical implementation guidance

2. **"Designing Data-Intensive Applications"** by Martin Kleppmann
   - Distributed systems patterns
   - Conflict resolution strategies

3. **"Web Application Security"** by Andrew Hoffman
   - OWASP Top 10 deep dives
   - Secure coding practices

### Online Resources

- [Mozilla Developer Network - Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Google Web Fundamentals - Security](https://developers.google.com/web/fundamentals/security)
- [Socket.IO Documentation](https://socket.io/docs/)

---

::: info Contributions
Found a relevant paper or resource? [Submit a pull request](https://github.com/AICL-Lab/brave-sync-notes/pulls) to add it to this list.
:::
