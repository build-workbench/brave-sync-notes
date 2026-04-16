---
layout: default
title: 安全与同步机制
description: 端到端加密、房间加入、同步广播、冲突处理与服务端防护边界说明。
permalink: /security-sync/
---

# 安全与同步机制

Note Sync Now 的核心价值不只是“实时同步”，而是“在不把明文交给服务端的前提下完成同步协作”。本页说明当前实现中的安全边界与同步主链路。

## 端到端加密边界

系统遵循“客户端加密、服务端中转密文”的原则。

### 客户端负责

- 助记词相关密钥派生
- 内容加密与解密
- 接收远端更新后的冲突判断
- 本地历史记录与状态更新

相关代码：
- `brave-sync-notes/client/src/hooks/useSocket.js`
- `brave-sync-notes/client/src/utils/crypto`
- `brave-sync-notes/client/src/store/useStore.js`

### 服务端负责

- 房间成员管理
- 同步事件分发
- 数据格式、大小与频率限制
- 持久化密文载荷
- 健康检查与统计信息

相关代码：
- `brave-sync-notes/server/index.js`
- `brave-sync-notes/server/src/persistence/PersistenceAdapter.js`
- `brave-sync-notes/server/src/persistence/PersistenceManager.js`

服务端不负责明文编辑逻辑，也不应依赖客户端内容语义来进行协作处理。

## 关键同步流程

### 1. 加入同步链

客户端调用 `joinChain` 后：

1. 通过助记词派生房间与加密相关信息
2. 建立 Socket 连接
3. 发送 `join-chain` 事件并附带 `roomId` 与设备名
4. 服务端校验房间 ID
5. 服务端将 socket 加入对应房间
6. 如果已有历史密文，服务端立即返回 `sync-update`
7. 服务端广播最新 `room-info`

### 2. 推送更新

用户编辑内容后：

1. 客户端对内容进行防抖处理
2. 内容较大时按块拆分
3. 客户端加密后发出 `push-update`
4. 服务端校验成员资格、数据格式与体积
5. 服务端写入持久化层或内存层
6. 服务端向房间其他成员广播 `sync-update`
7. 服务端向发送端返回 `update-ack`

### 3. 重连与主动同步

当网络波动或客户端恢复时：

- 客户端监听重连事件并自动重新发送 `join-chain`
- 客户端也可以主动触发 `request-sync`
- 服务端优先从持久化层读取最新密文；若不可用则回退到内存层

## 冲突处理

当前实现不是简单的“谁最后写谁赢”。客户端集成了冲突管理模块，用于处理本地未同步修改与远端新内容同时出现的情况。

已接入的关键能力包括：

- 比较本地内容与远端内容哈希/版本信息
- 判断是否存在并发编辑或离线分叉
- 维护待处理冲突列表
- 支持人工解决冲突并清理冲突状态

这部分逻辑的核心入口在：
- `brave-sync-notes/client/src/hooks/useSocket.js`
- `brave-sync-notes/client/src/utils/conflict`

## 服务端防护边界

当前服务端已经实现若干直接防护措施：

### 输入验证

- 房间 ID 必须满足长度与字符格式限制
- 更新载荷必须包含字符串形式的 `encryptedData`

### 访问控制

- 只有已加入房间的 socket 才能向该房间执行 `push-update`

### 大小限制

- 单次密文更新大小上限约为 5MB
- Socket 层 `maxHttpBufferSize` 额外限制传输上限

### 频率限制

- 每个 socket 每分钟最多提交 30 次更新

### 数据清理

- 分块传输会话有超时清理机制
- 空闲过久且无客户端连接的房间会按 TTL 清理
- 房间总数超过上限时，会优先淘汰最旧且无连接的房间

## 运行时可观测性

服务端提供：

- `/health`：基本健康状态、连接数、房间数、持久化状态
- `/stats`：连接数、房间数、内存使用与持久化统计

这两个接口适合在开发、部署排障和后续 CI / 监控接入时使用。

## 当前工程重点

接下来最值得优先增强的是：

1. 为 `useSocket` 补更贴近真实使用路径的测试
2. 为服务端事件流补 join / sync / error 主链路测试
3. 把这些现有测试接入 CI，形成稳定质量门禁

## 推荐阅读顺序

1. [仓库概览]({{ '/overview/' | relative_url }})
2. [架构说明]({{ '/architecture/' | relative_url }})
3. 当前页面：安全与同步机制
4. [部署与运行]({{ '/deployment/' | relative_url }})
5. [更新日志]({{ '/changelog/' | relative_url }})
