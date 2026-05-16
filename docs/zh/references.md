---
layout: default
title: 学术引用
description: Note Sync Now 设计参考的学术论文与标准规范
---

# 学术引用与参考

本文档列出 Note Sync Now 设计中参考的学术论文、技术标准和相关项目。

## 密码学标准

### BIP39 - 助记词生成

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

**在 Note Sync Now 中的应用：**
- 12 词助记词生成
- 跨设备恢复机制
- 人类可读的密钥表示

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

**实现参数：**
- 迭代次数：100,000
- 哈希函数：SHA-256
- 输出：256 位密钥

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

**安全属性：**
- 机密性 + 完整性（认证加密）
- 128 位认证标签
- 支持附加认证数据 (AAD)

## 同步算法

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

**相关性：**
- 三路合并的替代方案（复杂场景）
- 无需协调即可实现最终一致性
- Yjs、Automerge 等项目采用

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

**相关性：**
- Google Docs 协作的基础
- 需要中央协调服务器
- 某些操作比 CRDTs 更复杂

## 相关开源项目

| 项目 | 描述 | 许可证 | 参考价值 |
|------|------|--------|---------|
| [Standard Notes](https://github.com/standardnotes/app) | 端到端加密笔记 | AGPL-3.0 | 加密架构参考 |
| [Yjs](https://github.com/yjs/yjs) | CRDT 框架 | MIT | 冲突解决算法 |
| [Trilium Notes](https://github.com/zadam/trilium) | 层级笔记系统 | AGPL-3.0 | 架构设计参考 |
| [Joplin](https://github.com/laurent22/joplin) | 开源笔记+同步 | MIT | 同步机制参考 |
| [Signal Protocol](https://github.com/signalapp/libsignal) | 端到端加密协议 | AGPL-3.0 | 现代 E2EE 最佳实践 |
| [Automerge](https://github.com/automerge/automerge) | CRDT 库 | MIT | Yjs 替代方案 |

## 安全研究

### OWASP 指南

| 资源 | 应用 |
|------|------|
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | 安全验证标准 |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | 实现最佳实践 |
| [OWASP Top 10](https://owasp.org/www-project-top-ten/) | 常见漏洞意识 |

### NIST 网络安全框架

- **识别**：资产管理、风险评估
- **保护**：访问控制、加密、数据安全
- **检测**：异常检测、监控
- **响应**：事件响应计划
- **恢复**：恢复计划、备份

## WebSocket 与实时通信

### RFC 6455 - WebSocket 协议

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

### Socket.IO 协议

- 实时双向事件驱动通信
- 自动重连与退避
- 房间/命名空间多路复用支持

## Web 标准

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

**使用：**
- `SubtleCrypto.encrypt()` / `decrypt()` 用于 AES-GCM
- `SubtleCrypto.deriveKey()` 用于 PBKDF2
- `SubtleCrypto.importKey()` 用于密钥管理

### IndexedDB

> **W3C Recommendation**

- 浏览器原生 NoSQL 数据库
- 事务支持
- 索引和查询能力

## 延伸阅读

### 书籍

1. **《Serious Cryptography》** 作者：Jean-Philippe Aumasson
   - 现代密码学原语详解
   - 实践实现指南

2. **《Designing Data-Intensive Applications》** 作者：Martin Kleppmann
   - 分布式系统模式
   - 冲突解决策略

3. **《Web Application Security》** 作者：Andrew Hoffman
   - OWASP Top 10 深入解析
   - 安全编码实践

### 在线资源

- [Mozilla Developer Network - Web Crypto API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API)
- [Google Web Fundamentals - Security](https://developers.google.com/web/fundamentals/security)
- [Socket.IO 文档](https://socket.io/zh-CN/docs/)

---

::: info 贡献
发现了相关的论文或资源？[提交 Pull Request](https://github.com/AICL-Lab/brave-sync-notes/pulls) 添加到此列表。
:::
