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
3. **加密密钥**（私有）：`PBKDF2(mnemonic, salt, 310000, SHA-256)` → AES-256 CryptoKey
   - salt = `SHA-256("notesync-salt:" + mnemonic)`（由助记词确定性派生，见下方已知局限）
   - 可通过 `VITE_PBKDF2_ITERATIONS` 配置，下限 100000
   - 使用 Web Crypto API 原生派生

### 加密算法

- **算法**：AES-256-GCM（认证加密）
- **IV**：96 位随机数，每次加密重新生成
- **格式**：Base64(IV ‖ ciphertext ‖ authTag)
- **密钥**：CryptoKey 对象，仅存于内存，不持久化

### 已知安全局限（如实披露）

- **助记词明文持久化于本地**：为支持刷新后自动恢复，助记词以明文存储在
  localStorage 与 IndexedDB 中。CryptoKey 本身不落盘，但拿到本机存储访问权的
  恶意代码（如 XSS）可窃取助记词并永久解密全部同步数据。
- **无前向保密与撤销机制**：静态助记钥，助记词泄露后历史密文永久可解，
  且无法将已知助记词的设备移出房间（知道助记词即永久成员）。
- **重放防护不完整**：v2 信封的 AAD 绑定 roomId/deviceId/seq/timestamp，
  密文跨上下文搬运即解密失败；但 seq 仅由发送端本地单调递增，服务端不校验、
  接收端不跟踪水位，恶意服务器仍可原样重放旧信封使客户端回滚。
  完整防重放需要服务端 per-device 序号状态机（未实现）。
- **salt 由密码派生**：违反 salt 的随机性语义，削弱对预计算攻击的防护。
- **元数据可见**：服务器掌握 roomId、设备名、时间戳、密文长度与 IP，
  "无追踪"仅指无账号体系。
- **限流按连接计数**：速率预算挂在 socket 连接上，断开重连即重置；
  攻击者可换连接绕过每分钟配额（未做 IP 级限流）。
- **持久化降级无数据迁移**：Redis 不可用时切到 SQLite，期间新数据写入备用库；
  Redis 恢复后不会自动回切，也不合并备用库数据（轻量定位下的取舍）。

### 安全属性

| 属性 | 保证 |
|------|------|
| 机密性 | 无密钥者无法解密密文（传输与服务端存储层面） |
| 完整性 | GCM authTag 检测密文篡改（不含元数据绑定与新鲜性） |
| 零知识 | 服务器只接触密文，永不接触密钥或明文 |

## 同步协议

### Socket 事件

| 方向 | 事件 | 用途 |
|------|------|------|
| → 服务端 | `join-chain` | 加入同步房间，获取历史密文 |
| → 服务端 | `push-update`（带 ack 回调） | 推送加密更新，服务端确认后才算已同步 |
| → 服务端 | `request-sync` | 请求最新数据（重连场景） |
| ← 客户端 | `join-ack` | 服务端确认加入成功（客户端收到后才冲刷离线队列） |
| ← 客户端 | `sync-update` | 广播加密更新 |
| ← 客户端 | `room-info` | 房间成员列表 |
| ← 客户端 | `error` | 结构化错误 `{ type, message, code, recoverable }` |

### 同步流程

1. 用户输入助记词 → 客户端派生 roomId + encryptionKey
2. `join-chain` → 服务端查询历史密文 → 返回 `sync-update` + `join-ack`
3. 收到 `join-ack` 后客户端冲刷离线队列（已确认成为成员，推送不会被拒）
4. 用户编辑 → 防抖 → 加密 → `push-update`（等待 ack 确认）→ 服务端存储 + 广播
5. 其他客户端收到 `sync-update` → 解密 → 冲突检测 → 更新或提示
6. 推送未确认（超时/被拒）时本地保持 dirty 或留在离线队列，不会误报已同步

### 冲突解决

- 冲突判定基于内容哈希 + 时间窗（5 秒内为并发编辑，超出为离线分歧）；
  服务端 version 为毫秒时间戳、本地为小计数器，二者量纲不同，不参与排序比较
- 冲突时弹出 UI 让用户手动选择（`autoResolveStrategy: 'manual'`）
- 不自动覆盖，避免静默数据丢失
- 三路合并代码保留但当前无共同祖先来源，实际不参与运行路径

### 传输与限流上限

- 单条密文推送（AES-256-GCM 加密后上限 5MB，约 3.7MB 明文）
- 服务端校验密文大小，超限拒绝（`MAX_DATA_SIZE_BYTES`）
- Socket.IO `maxHttpBufferSize` 与其保持一致（约 5.5MB）
- 每连接每分钟事件预算：`push-update` 30 次、`request-sync` 60 次、`join-chain` 10 次
  （计数挂在连接元数据上，断开重连会重置——已知局限）
- `request-sync` 与 `push-update` 一致要求房间成员身份

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
