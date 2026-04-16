# v2.2.0 Release Notes

## English

### What's New in v2.2.0

**Release Date**: 2026-03-22

#### 📚 Documentation Site Complete
- Added comprehensive documentation portal with bilingual support
- Created dedicated `docs/` directory with English and Chinese versions
- Added detailed guides for getting started, architecture, deployment, and security
- Added API reference documentation (WebSocket and REST)
- Refactored `changelog/` directory with professional structure

#### 🔧 CI Pipeline Enhanced
- Split CI into client and server jobs for parallel execution
- Integrated test execution for both client and server
- Added concurrency configuration to prevent duplicate runs

#### ✅ Test Coverage
- Client: `useSocket.test.js` - connection, sync-update, request-sync, error handling
- Server: `index.test.js` - health check, join-chain, push-update, request-sync

#### 🐛 Bug Fixes
- Server timer cleanup with `unref()` to prevent test process hanging
- `gracefulShutdown` and `startServer` no longer call `process.exit()` in test environment
- Extracted `handleSocketConnection` for direct socket event testing

### Upgrade Notes

No breaking changes. Safe to upgrade from v2.1.0.

---

## 中文

### v2.2.0 更新内容

**发布日期**：2026年3月22日

#### 📚 文档站完成
- 添加了具有双语支持的全面文档门户
- 创建了包含英文和中文版本的专用 `docs/` 目录
- 添加了详细的入门指南、架构说明、部署和安全指南
- 添加了 API 参考文档（WebSocket 和 REST）
- 重构了 `changelog/` 目录，结构更加专业

#### 🔧 CI 流水线增强
- 将 CI 拆分为客户端和服务端任务以并行执行
- 集成了客户端和服务端的测试执行
- 添加了并发配置以防止重复运行

#### ✅ 测试覆盖
- 客户端：`useSocket.test.js` - 连接、sync-update、request-sync、错误处理
- 服务端：`index.test.js` - 健康检查、join-chain、push-update、request-sync

#### 🐛 Bug 修复
- 服务端定时器使用 `unref()` 清理，防止测试进程挂起
- `gracefulShutdown` 和 `startServer` 在测试环境中不再调用 `process.exit()`
- 提取 `handleSocketConnection` 以便直接测试 Socket 事件

### 升级说明

无破坏性变更。可从 v2.1.0 安全升级。

---

## Assets

- Source code (zip)
- Source code (tar.gz)

## Links

- Documentation: https://lessup.github.io/brave-sync-notes/
- Full Changelog: https://github.com/LessUp/brave-sync-notes/blob/main/CHANGELOG.md
- 中文更新日志: https://github.com/LessUp/brave-sync-notes/blob/main/CHANGELOG.zh-CN.md
