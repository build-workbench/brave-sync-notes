# 2025-12-19 客户端冲突管理接入（ConflictManager + UI）

## 背景
此前客户端在收到服务端广播的 `sync-update` 后，会直接覆盖本地内容；当本地存在尚未同步（或正在编辑）的修改时，容易出现内容被远端更新“顶掉”的情况，且缺少可视化冲突提示与人工合并入口。

## 变更内容
- 为客户端 note 状态补齐版本化元数据：`noteVersion` / `noteTimestamp` / `noteDeviceId`。
  - `setNote(note, meta?)` 支持传入远端 `version/timestamp/deviceId`；本地编辑时仅更新时间戳，`noteVersion` 保持为“最后一次同步基线版本”（仅在收到远端 `meta.version` 时更新）。
  - `restoreFromHistory` 与 `resetConnection` 同步维护上述字段，保证状态一致。
- 在 `useSocket` 的 `sync-update` 流程中接入 `ConflictManager`：
  - 解密并重组（chunk）出完整远端内容后，基于 `lastSyncedHashRef` 判断本地是否存在未同步改动。
  - 若本地无未同步改动，则直接应用远端内容并更新 `lastSyncedHashRef`。
  - 若本地存在未同步改动，则调用 `ConflictManager.checkAndHandle(localData, remoteData)` 检测冲突；需要人工处理时入队冲突。
  - 从 hook 暴露 `conflictCount` / `pendingConflicts` / `resolveConflict` / `clearConflicts` 供 UI 使用。
  - 在成功发送 `pushUpdate` 后更新 `lastSyncedHashRef`，用于后续“本地是否脏”的判定。
- 在 `App.jsx` 中渲染冲突 UI：
  - 顶部显示 `ConflictIndicator`（冲突数量提示，点击打开）。
  - 使用 `ConflictDialog` 展示单个冲突并允许用户选择本地/远端或自定义合并。
  - 用户解决后调用 `resolveConflict`，随后将解决后的内容 `setNote + pushUpdate` 回推服务端。
  - 离开同步链时清理冲突队列。

## 影响范围
- **客户端**：
  - `brave-sync-notes/client/src/store/useStore.js`
  - `brave-sync-notes/client/src/hooks/useSocket.js`
  - `brave-sync-notes/client/src/App.jsx`

## 兼容性说明
- 不改变现有 Socket 事件协议字段（仍使用 `join-chain` / `push-update` / `sync-update` / `request-sync`）。
- 行为变化仅发生在客户端收到远端更新且本地存在未同步改动时：不再盲目覆盖，而是提示冲突并提供人工解决入口。
