# 安全策略

本项目已归档，不再接受安全更新。

## 安全特性

- **端到端加密**：客户端 AES-256-GCM，服务器只转发密文
- **零知识架构**：服务器永不接触明文或密钥
- **密钥派生**：PBKDF2（10,000 轮，SHA-256）
- **助记词恢复**：BIP39 标准 12 词

## 报告漏洞

发现安全问题请通过 [GitHub Security Advisories](https://github.com/vibe-knight/brave-sync-notes/security/advisories/new) 私下报告。
