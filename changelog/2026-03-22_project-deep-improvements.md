---
layout: default
title: 2026-03-22 项目深度完善：文档站闭环、CI 门禁与同步链路测试
description: 补全文档站导航与深度页，增强 Pages / CI 工作流，并为客户端与服务端补同步主链路测试。
permalink: /changelog/2026-03-22-project-deep-improvements/
---

# 2026-03-22 项目深度完善：文档站闭环、CI 门禁与同步链路测试

## 变更背景

- 项目已有 GitHub Pages 首页、基础 changelog 和前后端测试框架，但文档站仍缺少深度页、更新索引与稳定导航闭环。
- CI 仅覆盖 client 构建与 server 安装，尚未真正执行现有测试。
- 同步主链路的自动化验证不足，`useSocket` 与服务端事件流缺少直接测试保护。

## 文档站完善

- 为 `README.md`、`README.zh-CN.md`、`CONTRIBUTING.md` 补充站点化 front matter、固定 permalink 与文档入口链接。
- 新增 `changelog/index.md`，把分散日志条目整理为可浏览归档页。
- 新增三篇公开深度页：
  - `architecture.md`
  - `deployment.md`
  - `security-sync.md`
- 调整 `index.md`，把首页阅读路径从直接指向源码目录，改为先进入概览、架构、部署、安全与贡献文档。

## Pages / CI 工作流增强

- `.github/workflows/pages.yml` 改为对根目录 Markdown 变更统一触发，移除 sparse checkout 白名单重复维护，降低后续新增页面的维护成本。
- `.github/workflows/ci.yml` 拆分为 `client` 与 `server` 两个 job，并接入：
  - client `npm test -- --run`
  - client `npm run build`
  - server `npm test`

## 同步链路测试补强

### 客户端

- 新增 `brave-sync-notes/client/src/hooks/useSocket.test.js`
- 覆盖以下关键路径：
  - 连接成功后 `join-chain`
  - `sync-update` 更新 store 与历史
  - `request-sync` 主动拉取
  - socket `error` 提示反馈

### 服务端

- 为 `brave-sync-notes/server/index.js` 增加可测试导出与非 CLI 启动保护
- 新增 `brave-sync-notes/server/index.test.js`
- 覆盖以下关键路径：
  - `/health` 健康检查
  - `join-chain` 非法 roomId
  - `push-update` 非成员拒绝与成员成功写入
  - `request-sync` 返回已有房间数据

## 实现细节补充

- 为服务端定时清理器调用 `unref()`，避免测试进程被定时器悬挂。
- 调整 `gracefulShutdown` 与 `startServer`，使其在测试场景下不会直接 `process.exit()`。
- 抽出 `handleSocketConnection`，便于直接测试 Socket 事件处理逻辑。

## 验证结果

### 客户端

执行：

```bash
cd brave-sync-notes/client && npm test -- --run && npm run build
```

结果：
- 全量 Vitest 通过
- `useSocket.test.js` 新增 4 个测试通过
- 客户端构建通过

### 服务端

执行：

```bash
cd brave-sync-notes/server && npm test
```

结果：
- 3 个测试套件全部通过
- 共 14 个测试通过

## 后续建议

- 下一步可继续把 `test:property` 逐步纳入 CI 的增强门禁。
- 若后续补更多公开文档页面，可继续沿用当前 Pages 结构，不再需要同步维护白名单。
- 可进一步为重连、冲突处理与分块传输补更多集成测试。