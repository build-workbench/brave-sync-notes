# 更新日志

本文件记录了项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 共享工具函数：ID 生成和内容哈希

### Changed
- 移除代码库中约 60+ 个冗余的 console.log 语句
- 将重复代码整合到共享工具模块

---

## [2.2.0] - 2026-03-22

### Added
- **文档站**：完整导航闭环和深度页面
  - 添加 `changelog/index.md` 作为可浏览归档页
  - 添加深度文档页面：`architecture.md`、`deployment.md`、`security-sync.md`
  - 为所有文档文件添加 front matter 和固定链接

- **CI 流水线**：增强工作流门禁
  - 拆分 CI 为 `client` 和 `server` 两个 job
  - 集成客户端和服务端测试执行

- **测试**：同步链路测试覆盖
  - 客户端：`useSocket.test.js` - 连接、sync-update、request-sync、错误处理
  - 服务端：`index.test.js` - 健康检查、join-chain、push-update、request-sync

### Fixed
- 服务端定时器调用 `unref()` 防止测试进程悬挂
- `gracefulShutdown` 和 `startServer` 在测试环境不再调用 `process.exit()`
- 提取 `handleSocketConnection` 便于直接测试 Socket 事件处理

---

## [2.1.0] - 2026-03-13

### Changed
- **文档架构**：重构入口职责
  - `README.md` / `README.zh-CN.md`：仅作为仓库入口（定位、快速启动、链接）
  - `index.md`：文档门户，包含阅读路径指引
  - `CONTRIBUTING.md`：集成到文档站点

- **配置修复**：
  - 修复 `_config.yml` 仓库名从 `LessUp/sync-notes` 到 `LessUp/brave-sync-notes`
  - 修复 `baseurl` 从 `/sync-notes` 到 `/brave-sync-notes`
  - 添加 `CONTRIBUTING.md` 到 Pages 工作流路径

---

## [2.0.2] - 2026-03-10

### Added
- **工作流标准化**：
  - 统一 CI 权限：`contents: read`
  - 添加并发配置防止重复运行
  - 添加 `actions/configure-pages@v5` 步骤
  - 添加 `paths` 触发过滤减少无效构建

### Changed
- **GitHub Pages 优化**：
  - 添加 SEO 元数据到 `_config.yml`
  - 添加 `exclude` 列表跳过非文档文件的 Jekyll 构建
  - 优化 `paths` 触发器为特定文件
  - 修复 `sparse-checkout` 配置
  - 添加部署状态徽章到 `index.md`

---

## [2.0.1] - 2026-03-09 [SECURITY]

### Security
- **[严重] 服务端输入验证**：
  - 添加 `encryptedData` 验证：必须为字符串，最大 5MB
  - 添加每 socket 速率限制：每分钟最多 30 次更新
  - 添加 `timestamp` 类型验证

- **[破坏性] PBKDF2 盐值改进**：
  - 从硬编码盐值改为助记词派生盐值：`SHA256("notesync-salt:" + mnemonic)`
  - PBKDF2 迭代次数从 1,000 增加到 10,000
  - ⚠️ **破坏性变更**：现有同步链需要重新创建

### Fixed
- **内存泄漏**：房间清理增强
  - 添加 `MAX_MEMORY_ROOMS` 硬上限（默认 10,000）
  - 两阶段清理：先清理过期房间，超容量时清理最旧房间
  - 清理间隔从 60 分钟减少到 30 分钟

- **Socket 事件监听器泄漏**：修复快速调用 `joinChain` 时的竞态条件
  - 在移除监听器前设置 `socketRef.current = null`
  - 取消前一个会话的待处理防抖推送
  - 清除待处理的分块重组状态

---

## [2.0.0] - 2025-11-25

### Added
- **编辑器**：CodeMirror 集成
  - 语法高亮：Markdown、JavaScript、Python、HTML、CSS、JSON
  - 自动补全、括号匹配、代码折叠
  - 可自定义字体大小、Tab 大小、行号、自动换行
  - 深色/浅色主题自动切换

- **预览**：增强 Markdown 渲染
  - Prism 代码块高亮
  - GFM 支持：表格、任务列表、删除线
  - 分屏视图：编辑/预览/并排

- **历史记录**：版本管理
  - 每次同步自动保存
  - 一键恢复任意版本
  - 单条删除或清空全部
  - LocalStorage 持久化

- **移动端**：二维码加入
  - 自动生成同步链二维码
  - 手机扫码即时加入
  - URL 参数自动填充

- **导入导出**：文件操作
  - 导入 .txt、.md、.markdown 文件
  - 导出为 Markdown 或纯文本

### Changed
- **性能**：
  - 大于 50KB 内容分块传输
  - 可配置防抖同步（默认 300ms）
  - Zustand 状态管理
  - 组件懒加载
  - useMemo 记忆化

- **UI/UX**：
  - Framer Motion 动画的毛玻璃设计
  - 完全响应式，移动端优先布局
  - 系统深色模式偏好支持
  - 双语界面（中/英）

- **服务端**：
  - 连接池：WebSocket + Polling 双通道
  - 自动清理过期房间
  - 健康检查：`GET /health`、`GET /stats`
  - 优雅关闭：SIGTERM/SIGINT
  - 配置：maxHttpBufferSize 10MB、pingTimeout 60s

---

## [1.2.0] - 2025-12-19

### Added
- **冲突管理**：客户端冲突检测与解决
  - 添加 `noteVersion`、`noteTimestamp`、`noteDeviceId` 到 store 状态
  - 在 `sync-update` 流程中集成 `ConflictManager`
  - `ConflictIndicator` 和 `ConflictDialog` UI 组件
  - 手动解决：保留本地/远程或自定义合并

### Changed
- `setNote(note, meta?)` 支持远程元数据
- `restoreFromHistory` 维护版本元数据
- 从 hook 暴露 `conflictCount`、`pendingConflicts`、`resolveConflict`、`clearConflicts`

---

## [1.1.0] - 2025-12-18

### Fixed
- **[严重] 异步处理器**：修复 `join-chain` 回调未声明为 `async`
- **配置**：
  - 服务端启动时添加 `require('dotenv').config()`
  - 使用 `DataValidator.isValidRoomId()` 统一房间 ID 验证
  - CORS Origin 可通过 `CORS_ORIGIN` 环境变量配置
  - 房间 TTL 可通过 `ROOM_TTL_MS` 环境变量配置

---

## [1.0.1] - 2025-11-24

### Added
- **部署**：生产环境准备
  - 添加客户端 `.gitignore`（node_modules、构建产物、环境文件）
  - 规划使用 Netlify CLI 部署 Vite + React 前端

---

## [1.0.0] - 2025-02-13

### Added
- **项目基础设施**：
  - 添加 `.editorconfig` 统一代码格式
  - 添加标准徽章到 README（License、React、Express、Socket.IO、Vite）

---

[Unreleased]: https://github.com/LessUp/brave-sync-notes/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/LessUp/brave-sync-notes/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/LessUp/brave-sync-notes/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/LessUp/brave-sync-notes/releases/tag/v1.0.0
