# 安全策略

本项目已归档，不再接受安全更新。

## 安全特性

- **端到端加密**：客户端 AES-256-GCM，服务器只转发密文
- **零知识架构**：服务器永不接触明文或密钥
- **密钥派生**：PBKDF2（默认 310,000 轮，SHA-256，下限 100,000）
- **助记词恢复**：BIP39 标准 12 词

## 已知局限

- 助记词以**明文**持久化在浏览器 localStorage / IndexedDB 中以支持自动恢复；
  本机存储被攻破（如 XSS）即等于密钥泄露
- 消息无序号/nonce，GCM 未绑定元数据（AAD），恶意服务器可重放旧密文
- 无前向保密；助记词泄露后历史密文永久可解，且无法撤销设备
- 服务器可见元数据：roomId、设备名、时间戳、密文长度、IP

## 报告漏洞

发现安全问题请通过 [GitHub Security Advisories](https://github.com/build-workbench/shadow-note/security/advisories/new) 私下报告。
