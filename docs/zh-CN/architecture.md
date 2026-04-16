---
layout: default
title: 架构说明
description: Note Sync Now 的系统边界、核心模块与同步数据流概览。
permalink: /architecture/
---

# 架构说明

Note Sync Now 由一个 React + Vite 客户端、一个 Express + Socket.IO 服务端，以及一套 GitHub Pages 文档站组成。系统设计遵循“客户端负责加密与恢复，服务端负责中转与持久化”的边界。

## 总体分层

### 客户端层

- React 负责界面与交互
- Zustand 负责本地状态管理
- `useSocket` 负责实时同步链路
- `crypto` 模块负责密钥派生、加密与解密
- 冲突管理模块负责本地与远端内容差异处理
- 本地存储模块负责 IndexedDB / LocalStorage 能力承接

关键路径：
- `brave-sync-notes/client/src/App.jsx`
- `brave-sync-notes/client/src/hooks/useSocket.js`
- `brave-sync-notes/client/src/store/useStore.js`
- `brave-sync-notes/client/src/utils/crypto`
- `brave-sync-notes/client/src/utils/conflict`
- `brave-sync-notes/client/src/utils/storage`

### 服务端层

- Express 暴露健康检查与统计接口
- Socket.IO 处理房间加入、同步广播、错误反馈与成员列表
- `PersistenceManager` 负责持久化适配
- Redis / SQLite 作为可切换的存储后端
- 内存 Map 作为最后兜底存储

关键路径：
- `brave-sync-notes/server/index.js`
- `brave-sync-notes/server/src/persistence/PersistenceManager.js`
- `brave-sync-notes/server/src/persistence/PersistenceAdapter.js`

## 核心架构原则

1. **端到端加密优先**：笔记内容在客户端侧加密，服务端只接收密文。
2. **助记词驱动恢复**：客户端通过助记词派生房间与加密相关信息。
3. **服务端尽量无状态**：服务端聚焦同步转发、短期内存态与持久化兜底。
4. **冲突显式处理**：本地编辑与远端更新冲突时，不把所有情况都简化为覆盖写入。
5. **多层存储退化**：优先使用持久化存储，不可用时回退到内存模式。

## 同步数据流

1. 用户在客户端编辑内容。
2. Zustand 更新当前笔记状态。
3. `useSocket` 对内容进行加密，并按需要拆分为分块载荷。
4. 客户端通过 `push-update` 将密文发送到服务端。
5. 服务端验证房间成员资格、数据格式、大小与频率限制。
6. 服务端将最新密文保存在持久化层或内存兜底层。
7. 服务端通过 `sync-update` 向房间内其他成员广播更新。
8. 接收端客户端解密数据，必要时进入冲突检测与人工解决流程。

## 关键模块关系

### 客户端同步引擎

`useSocket.js` 是客户端同步主入口，承担：

- 创建与维护 Socket 连接
- 首次 `join-chain`
- 断线重连后的重新加入
- 远端 `sync-update` 解密与落库
- `request-sync` 主动拉取
- 历史记录节流保存
- 冲突管理器调用

### 服务端事件模型

`server/index.js` 当前的关键事件包括：

- `join-chain`：加入同步链并返回现有数据
- `push-update`：提交最新密文更新
- `request-sync`：重连或恢复后请求最新状态
- `room-info`：广播房间成员信息
- `update-ack`：确认服务端已接收更新
- `error`：返回参数、权限或限流错误

## 当前实现重点

根据现有设计文档与代码实现，本项目当前重点在于：

- 稳定的端到端同步主链路
- 冲突检测与人工解决集成
- 服务端持久化与回退策略
- 后续多笔记、离线队列与更强本地存储能力的可扩展性

## 推荐阅读顺序

1. [仓库概览]({{ '/overview/' | relative_url }})
2. 当前页面：架构说明
3. [部署与运行]({{ '/deployment/' | relative_url }})
4. [安全与同步机制]({{ '/security-sync/' | relative_url }})
5. [贡献指南]({{ '/contributing/' | relative_url }})
6. [更新日志]({{ '/changelog/' | relative_url }})
