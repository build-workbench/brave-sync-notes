# 架构设计

> 本文档是项目归档前的最终架构快照。

## 系统概览

```
┌─────────────────────── 客户端 ───────────────────────┐
│  React 18 + Vite + Zustand + CodeMirror 6           │
│                                                       │
│  用户界面 → 状态管理 → 加密模块 → useSocket 同步引擎  │
│                ↓                    ↓                 │
│           IndexedDB 存储      WebSocket (Socket.IO)   │
└───────────────────────────────┬───────────────────────┘
                                │ 密文传输
┌───────────────────────────────▼───────────────────────┐
│                   服务端 (Express + Socket.IO)        │
│  房间管理 → 事件分发 → 速率限制 → 持久化               │
│                         ↓                              │
│              Redis / SQLite / 内存（自动降级）         │
└───────────────────────────────────────────────────────┘
```

## 端到端加密协议

### 密钥派生

1. **BIP39 助记词**：12 词标准助记词，128 位熵
2. **房间 ID**（公开）：`SHA-256(mnemonic)` → 64 位十六进制字符串
3. **加密密钥**（私有）：`PBKDF2(mnemonic, salt, 10000, SHA-256)` → AES-256 CryptoKey
   - salt = `SHA-256("notesync-salt:" + mnemonic)`
   - 使用 Web Crypto API 原生派生

### 加密算法

- **算法**：AES-256-GCM（认证加密）
- **IV**：96 位随机数，每次加密重新生成
- **格式**：Base64(IV ‖ ciphertext ‖ authTag)
- **密钥**：CryptoKey 对象，仅存于内存，不持久化

### 安全属性

| 属性 | 保证 |
|------|------|
| 机密性 | 无密钥者无法解密密文 |
| 完整性 | GCM authTag 检测任何篡改 |
| 零知识 | 服务器只接触密文，永不接触密钥或明文 |

## 同步协议

### Socket 事件

| 方向 | 事件 | 用途 |
|------|------|------|
| → 服务端 | `join-chain` | 加入同步房间，获取历史密文 |
| → 服务端 | `push-update` | 推送加密更新 |
| → 服务端 | `request-sync` | 请求最新数据（重连场景） |
| ← 客户端 | `sync-update` | 广播加密更新 |
| ← 客户端 | `room-info` | 房间成员列表 |
| ← 客户端 | `error` | 错误通知 |

### 同步流程

1. 用户输入助记词 → 客户端派生 roomId + encryptionKey
2. `join-chain` → 服务端查询历史密文 → 返回 `sync-update`
3. 用户编辑 → 防抖 → 加密 → `push-update` → 服务端存储 + 广播
4. 其他客户端收到 `sync-update` → 解密 → 冲突检测 → 更新或提示

### 冲突解决

- 三路合并算法（基于版本号 + 时间戳 + 设备 ID）
- 冲突时弹出 UI 让用户手动选择
- 不自动覆盖，避免静默数据丢失

### 分块传输

- 内容 > 100KB 时自动分块
- 每块独立加密，通过 sessionId 关联
- 服务端组装后广播

## 模块职责

### 客户端 (`apps/web/`)

| 模块 | 文件 | 职责 |
|------|------|------|
| 加密 | `src/utils/crypto.js` | SHA-256、PBKDF2、AES-GCM |
| 同步引擎 | `src/hooks/useSocket.js` | Socket 连接、事件处理 |
| 状态管理 | `src/store/useStore.js` | Zustand store |
| 笔记模型 | `src/utils/notebooks.js` | 笔记本/笔记 CRUD |
| 冲突管理 | `src/utils/conflict/` | 三路合并 |
| 本地存储 | `src/utils/storage/` | IndexedDB / LocalStorage |
| 离线队列 | `src/utils/offline/` | 离线编辑排队 |

### 服务端 (`apps/api/`)

| 模块 | 文件 | 职责 |
|------|------|------|
| 服务入口 | `index.js` | Express + Socket.IO |
| 持久化 | `src/persistence/` | Redis / SQLite / 内存适配器 |
| 日志 | `src/utils/logger.js` | 结构化日志 |

## 存储架构

### 服务端（自动降级）

1. **Redis**（首选）：高性能，支持多实例
2. **SQLite**（降级）：文件存储，单机可用
3. **内存**（兜底）：Map 存储，重启丢失

### 客户端

1. **IndexedDB**（首选）：大容量结构化存储
2. **LocalStorage**（降级）：简单键值存储

## 关键设计决策

1. **roomId 同步派生**：SHA-256 实现为同步纯 JS，使 `createNotebook` 保持同步（Zustand store action 调用）
2. **encryptionKey 仅存内存**：CryptoKey 对象不序列化，每次 `joinChain` 时从助记词重新派生（带缓存）
3. **服务端无状态**：不处理明文，不做加密/解密，纯密文中转
4. **多层降级**：每一层存储都有 fallback，保证可用性
