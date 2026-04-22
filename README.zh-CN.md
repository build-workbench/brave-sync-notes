---
title: 安全同步笔记概览
description: 仓库概览与阅读入口，帮助快速启动项目并进入架构、部署与同步机制文档。
permalink: /zh/overview/
---

<div align="center">

# Note Sync Now / 安全同步笔记

<p align="center">
  <strong>端到端加密笔记同步系统</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LessUp/brave-sync-notes/ci.yml?branch=main&style=flat-square&label=CI" alt="CI Status"></a>
  <a href="https://lessup.github.io/brave-sync-notes/"><img src="https://img.shields.io/github/actions/workflow/status/LessUp/brave-sync-notes/pages.yml?branch=main&style=flat-square&label=Pages" alt="Pages Status"></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React 18">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white&style=flat-square" alt="Express 5">
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&style=flat-square" alt="Socket.IO 4">
</p>

<p align="center">
  <a href="https://lessup.github.io/brave-sync-notes/">📚 文档站</a> •
  <a href="https://lessup.github.io/brave-sync-notes/overview/">🏠 项目首页</a> •
  <a href="https://github.com/LessUp/brave-sync-notes/releases">📦 发布版本</a> •
  <a href="./CONTRIBUTING.md">🤝 贡献指南</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <b>简体中文</b>
</p>

</div>

---

Note Sync Now 是一个端到端加密笔记同步项目，用于探索助记词恢复、实时协作与隐私优先的多设备同步体验。

---

## ✨ 核心特性

<table>
<tr>
<td width="50%">

### 🔐 端到端加密
- 客户端 AES-256-GCM 加密
- 服务器仅转发密文
- 12词助记词恢复

### ⚡ 实时同步
- WebSocket + Socket.IO
- 自动分块传输 (>50KB)
- 智能重连机制

</td>
<td width="50%">

### 🔄 冲突解决
- 三路合并算法
- 手动解决 UI
- 版本追踪

### 💾 多层存储
- 服务端: Redis / SQLite / 内存
- 客户端: IndexedDB / LocalStorage
- 自动降级

</td>
</tr>
</table>

---

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  浏览器 A   │◄──►│  浏览器 B   │◄──►│  移动端 App │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│  [React + Vite]      [Zustand 状态]    [AES-256 加密]      │
└─────────┬──────────────────┬──────────────────┬─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       服务端                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Express + Socket.IO                                   │  │
│  │  • 房间管理                                            │  │
│  │  • 事件分发                                            │  │
│  │  • 速率限制                                            │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼──────────────────┐                   │
│  │      持久化层                        │                   │
│  │  ┌──────────┐ ┌──────────┐         │                   │
│  │  │  Redis   │ │  SQLite  │ (降级)  │                   │
│  │  └──────────┘ └──────────┘         │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

详细架构请参阅 [架构文档](./docs/zh-CN/architecture.md)。

---

## 📁 仓库结构

```
brave-sync-notes/
├── apps/
│   ├── web/                 # React + Vite 前端
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── hooks/       # 自定义 Hooks
│   │   │   ├── store/       # Zustand 状态管理
│   │   │   └── utils/       # 工具函数
│   │   └── tests/           # 测试文件
│   └── api/                 # Express + Socket.IO 后端
│       ├── src/
│       │   ├── persistence/ # 持久化存储
│       │   └── utils/       # 工具函数
│       └── tests/           # 测试文件
├── docs/                    # GitHub Pages 文档站
├── changelog/               # 版本历史
└── .github/workflows/       # CI/CD 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 pnpm
- Redis (可选，用于持久化存储)

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/LessUp/brave-sync-notes.git
cd brave-sync-notes

# 安装并启动后端
cd apps/api
npm ci
cp .env.example .env
npm start

# 新终端安装并启动前端
cd ../web
npm ci
cp .env.example .env
npm run dev
```

后端默认监听 `http://localhost:3002`，前端开发服务运行在 `http://localhost:5173`。

### Docker 部署

```bash
cd brave-sync-notes
docker-compose up -d
```

## 📖 文档入口

- [项目首页](https://lessup.github.io/brave-sync-notes/)
- [架构说明](https://lessup.github.io/brave-sync-notes/architecture/)
- [部署指南](https://lessup.github.io/brave-sync-notes/deployment/)
- [贡献指南](https://lessup.github.io/brave-sync-notes/contributing/)

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/⌘ + S` | 保存 |
| `Ctrl/⌘ + B` | 切换侧边栏 |
| `Ctrl/⌘ + P` | 切换预览 |
| `Ctrl/⌘ + H` | 切换历史 |
| `Ctrl/⌘ + N` | 新建笔记 |
| `Ctrl/⌘ + /` | 切换深色模式 |
| `Esc` | 关闭弹窗 |

## 🧪 测试

```bash
# 前端测试
cd apps/web && npm test -- --run

# 后端测试
cd apps/api && npm test

# 基于属性的测试
cd apps/api && npm run test:property

# 测试覆盖率
npm run test:coverage
```

---

## 📊 项目状态

| 指标 | 状态 |
|------|------|
| 最新版本 | [v2.2.0](https://github.com/LessUp/brave-sync-notes/releases/tag/v2.2.0) |
| 构建状态 | ![CI](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml/badge.svg) |
| 文档状态 | ![Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml/badge.svg) |
| 许可证 | [MIT](./LICENSE) |

---

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本历史。

---

## 🔄 OpenSpec 集成

本项目使用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 进行 AI 辅助的**规范驱动开发**。所有变更都通过结构化的提案进行管理。

### 快捷命令

| 命令 | 描述 |
|------|------|
| `/opsx:propose` | 创建新的变更提案 |
| `/opsx:explore` | 在提交前探索想法 |
| `/opsx:apply` | 实现变更任务 |
| `/opsx:archive` | 归档已完成的变更 |

### 工作流程

```
/opsx:propose "功能名称"  →  /opsx:apply  →  /opsx:archive
```

### 两层规范体系

| 目录 | 用途 |
|------|------|
| `specs/` | 稳定的、已批准的规范（Single Source of Truth）|
| `openspec/` | 变更管理和增量规范 |

详见 [AGENTS.md](./AGENTS.md) 了解详细工作流程。

---

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

快速链接：
- [报告 Bug](https://github.com/LessUp/brave-sync-notes/issues/new)
- [功能请求](https://github.com/LessUp/brave-sync-notes/discussions)
- [查看 Issues](https://github.com/LessUp/brave-sync-notes/issues)

---

## ❓ 常见问题

### Redis 是必须的吗？
不是，系统会自动降级到 SQLite 或内存存储。

### 笔记最大支持多大？
通过自动分块传输，支持最大 5MB 的内容。

### 12词助记词如何恢复？
助记词遵循 BIP39 标准，加密密钥由这 12 个词派生，可在任意设备安全恢复。

---

## 🔧 故障排除

### 连接失败
- 确保后端服务运行在 3002 端口
- 检查端口是否被占用：`lsof -i :3002`
- 确认防火墙允许 WebSocket 连接

### 同步不工作
- 确认两设备使用相同的助记词
- 检查浏览器控制台错误
- 确认 WebSocket 连接已建立（绿色指示器）

### Redis 连接错误
- 验证 Redis 是否运行：`redis-cli ping`
- 或让系统自动降级到 SQLite

---

## 📄 许可

本项目采用 [MIT 许可证](./LICENSE)。

---

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Socket.IO](https://socket.io/) - 实时通信
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Express](https://expressjs.com/) - Web 框架

---

<p align="center">
  由 <a href="https://github.com/LessUp">LessUp</a> 用 ❤️ 制作
</p>

<p align="center">
  <a href="https://lessup.github.io/brave-sync-notes/">🌐 网站</a> •
  <a href="https://github.com/LessUp">👥 GitHub</a>
</p>
