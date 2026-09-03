# AGENTS.md - AI 协作指南

> 业余项目，追求**轻灵巧**：代码精简、文档轻盈、流程轻量。

## 项目定位

**ShadowNote / 影笔记** -- 零知识的实时笔记同步系统：端到端加密、轻量自托管。
- 客户端加密（AES-256-GCM），服务器只转发密文
- 12 词 BIP39 助记词恢复密钥
- WebSocket 实时同步，离线优先，多设备协作

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + Tailwind CSS + Zustand + CodeMirror 6 |
| 后端 | Node.js 20 + Express 5 + Socket.IO 4 |
| 存储 | Redis / SQLite / 内存（服务端，自动降级）；IndexedDB / LocalStorage（客户端）|
| 测试 | Vitest（前端）+ Jest（后端）+ fast-check（属性测试）|

## 仓库结构

```
shadow-note/
├── apps/
│   ├── web/                 # React + Vite 前端
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── hooks/       # 自定义 Hooks（useSocket 等）
│   │   │   ├── store/       # Zustand 状态
│   │   │   └── utils/       # 工具函数（crypto 等）
│   │   └── tests/
│   └── api/                 # Express + Socket.IO 后端
│       ├── index.js         # 服务入口
│       ├── src/
│       │   ├── persistence/ # 持久化适配器
│       │   └── utils/
│       └── tests/
├── ARCHITECTURE.md          # 架构设计文档
├── CHANGELOG.md             # 更新日志
└── AGENTS.md                # 本文件
```

## 关键文件

| 用途 | 文件 |
|------|------|
| 客户端入口 | `apps/web/src/App.jsx` |
| WebSocket Hook | `apps/web/src/hooks/useSocket.js` |
| 全局状态 | `apps/web/src/store/useStore.js` |
| 加密模块 | `apps/web/src/utils/crypto.js` |
| 服务端入口 | `apps/api/index.js` |
| 持久化管理 | `apps/api/src/persistence/PersistenceManager.js` |

## 协作约定

### 代码风格
- **语言**：JavaScript（ES2022+），不使用 TypeScript；用 JSDoc 注释文档化函数
- **命名**：文件 `kebab-case.js`，函数/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`，类/组件 `PascalCase`
- **异步**：统一使用 `async/await`
- **错误对象**：结构化 `{ type, message, code, recoverable }`，**绝不**在错误信息中暴露加密密钥
- 遵循项目根目录的 ESLint 配置和 `.editorconfig`

### 工作流程（轻量版）
1. **先读代码**：动手前先理解相关模块和现有模式，模仿既有约定
2. **小步提交**：每个 commit 聚焦一件事，描述性信息（可选 conventional commits 风格 `feat:`/`fix:`/`docs:`）
3. **测试驱动**：修 bug 先写复现测试，再修复；新功能补测试
4. **同步文档**：用户可见的变更**必须**更新 `CHANGELOG.md` 的 `[Unreleased]` 段
5. **不镀金**：只做被要求的事，不擅自添加规格外的功能

### 验证命令

```bash
npm run test          # 前后端测试
npm run lint          # 前后端 lint
npm run build         # 构建前端

cd apps/web && npm test -- --run      # 前端测试
cd apps/api && npm test               # 后端测试
cd apps/api && npm run test:property  # 属性测试
```

### Socket 事件速查
- 客户端 -> 服务端：`join-chain`、`push-update`（带 ack 回调确认）、`request-sync`
- 服务端 -> 客户端：`join-ack`（确认加入成功）、`sync-update`、`room-info`、`error`
  （结构化 `{ type, message, code, recoverable }`）

### 加密参数
- 内容加密：AES-256-GCM（Web Crypto API 原生）
- 密钥派生：PBKDF2（10,000 轮，SHA-256，助记词派生盐值 `SHA-256("notesync-salt:" + mnemonic)`）
- 房间 ID：`SHA-256(mnemonic)` 同步纯 JS 实现
- 助记词：BIP39 标准 12 词

## 安全红线

- 永不提交密钥、令牌、密码到仓库
- 永不在错误信息或日志中暴露加密密钥
- 发现安全问题请私下报告，不要先开公开 issue

## CHANGELOG 维护规则

`CHANGELOG.md` 是本项目的**唯一变更记录**，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式：
- 所有用户可见变更写入 `[Unreleased]` 段
- 分类：`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`
- 发布版本时把 `[Unreleased]` 转为带日期的版本号，并补充底部对比链接
