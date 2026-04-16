---
layout: default
title: 部署与运行
description: 本地运行、服务端持久化、Pages 发布与工作流调整时需要关注的关键点。
permalink: /deployment/
---

# 部署与运行

本页说明如何本地运行 Note Sync Now，以及在调整部署与工作流时需要关注的配置边界。

## 本地运行

### 服务端

```bash
cd brave-sync-notes/server
npm ci
node index.js
```

默认端口：`3002`

常见环境变量：

- `PORT`
- `CORS_ORIGIN`（开发环境默认 `http://localhost:5173`，生产环境必须显式设置）
- `PRIMARY_STORAGE`
- `FALLBACK_STORAGE`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `SQLITE_DB_PATH`
- `ROOM_TTL_MS`
- `MAX_MEMORY_ROOMS`

关键入口：
- `brave-sync-notes/server/index.js`
- `brave-sync-notes/server/start-local.sh`
- `brave-sync-notes/server/.env.example`

`start-local.sh` 现在要求依赖已提前安装，并默认以 `NODE_ENV=development` 启动；未显式设置 `CORS_ORIGIN` 时会使用 `http://localhost:5173` 作为本地开发默认值。为避免本地启动时卡在 Redis 连接，它还会默认将 `PRIMARY_STORAGE` 与 `FALLBACK_STORAGE` 设为 `sqlite`。

### 客户端

```bash
cd brave-sync-notes/client
npm ci
npm run dev
```

默认开发地址通常为：`http://localhost:5173`

关键配置：
- `VITE_SOCKET_URL`（开发环境可省略，生产环境必须显式设置）
- `brave-sync-notes/client/vite.config.js`
- `brave-sync-notes/client/package.json`

本地开发时，客户端在未设置 `VITE_SOCKET_URL` 时会回退到 `http://localhost:3002`；非开发环境必须显式提供该变量，避免静默连接到错误地址。

## 服务端运行模型

服务端启动时会先初始化持久化层：

1. 尝试初始化 `PersistenceManager`
2. 按配置选择 Redis 作为主存储、SQLite 作为回退存储
3. 如果持久化初始化失败，则回退为纯内存模式
4. 继续暴露 `/health` 与 `/stats` 接口供运行状态检查

这意味着：

- 开发环境可以在没有完整持久化依赖时继续验证同步主链路
- 生产环境应优先确保主存储与回退存储都可用
- 回退到内存模式时，重启后无法保留原有同步状态

## GitHub Pages 文档站

当前仓库根目录承载 GitHub Pages 文档站，关键文件包括：

- `index.md`
- `README.md`
- `README.zh-CN.md`
- `CONTRIBUTING.md`
- `architecture.md`
- `deployment.md`
- `security-sync.md`
- `changelog/`
- `_config.yml`
- `.github/workflows/pages.yml`

Pages 主要用于：

- 项目导读
- 架构与同步机制说明
- 部署与运行说明
- 更新日志归档

## CI 与发布验证

建议本地至少执行以下命令：

```bash
cd brave-sync-notes/client && npm ci && npm test -- --run && npm run build
cd ../server && npm ci && npm test
```

如果修改了同步、持久化或验证逻辑，建议额外执行：

```bash
cd brave-sync-notes/server && npm run test:property
```

## 修改部署 / workflow 时的检查点

### 修改服务端时

重点确认：

- 健康检查 `/health` 是否仍可用
- `join-chain` / `push-update` / `request-sync` 是否仍保持兼容
- 持久化失败时是否仍能正确回退到内存模式

### 修改客户端同步逻辑时

重点确认：

- 本地开发允许 `VITE_SOCKET_URL` 回退到 `http://localhost:3002`
- 生产环境缺少 `VITE_SOCKET_URL` 时会给出明确错误
- 断线重连后会重新加入房间
- 错误事件与状态提示没有失效

### 修改 Pages / CI 工作流时

重点确认：

- Pages 能覆盖所有公开文档页面
- CI 至少执行 client 测试、client 构建、server 测试与 server property test
- 文档结构变化同步反映在 `changelog/` 中

## 推荐阅读顺序

1. [仓库概览]({{ '/overview/' | relative_url }})
2. [架构说明]({{ '/architecture/' | relative_url }})
3. 当前页面：部署与运行
4. [安全与同步机制]({{ '/security-sync/' | relative_url }})
5. [贡献指南]({{ '/contributing/' | relative_url }})
