# 2025-12-18 服务端 join-chain 异步修复与配置统一

## 背景
服务端 `join-chain` 事件处理函数内部使用了 `await persistenceManager.getRoom(...)`，但回调未声明为 `async`，会导致运行时语法错误，进而使服务端无法正常启动或无法处理加入同步链流程。

## 变更内容
- 修复 `join-chain` 事件回调为 `async`，保证 `await` 可用并确保加入流程可正确读取持久化数据。
- 服务端启动时加载环境变量：`require('dotenv').config()`。
- 统一房间 ID 校验逻辑：使用 `DataValidator.isValidRoomId(roomId)` 替代散落在业务逻辑里的长度/类型判断。
- CORS Origin 可配置：
  - Express：`app.use(cors({ origin: corsOrigin }))`
  - Socket.IO：`cors.origin = corsOrigin`
  - 环境变量：`CORS_ORIGIN`（默认 `*`）
- 内存房间数据清理阈值可配置：使用 `ROOM_TTL_MS`（默认 24h）替代硬编码的 `24 * 60 * 60 * 1000`。
- `.env.example` 补充 `ROOM_TTL_MS=86400000` 示例配置。

## 影响范围
- **服务端**：
  - `brave-sync-notes/server/index.js`
  - `brave-sync-notes/server/.env.example`

## 兼容性说明
- 不改变现有客户端协议字段（仍使用 `join-chain`, `sync-update`, `request-sync` 等事件）。
- 仅增强校验与运行时稳定性；默认行为与之前保持一致。
