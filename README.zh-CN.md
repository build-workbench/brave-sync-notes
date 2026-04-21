---
title: 安全同步笔记概览
description: 仓库概览与阅读入口，帮助快速启动项目并进入架构、部署与同步机制文档。
permalink: /zh/overview/
---

# Note Sync Now / 安全同步笔记

[English](https://lessup.github.io/brave-sync-notes/overview/) | 简体中文 | [文档站](https://lessup.github.io/brave-sync-notes/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)

Note Sync Now 是一个端到端加密笔记同步项目，用于探索助记词恢复、实时协作与隐私优先的多设备同步体验。

## ✨ 核心特性

- **端到端加密**：使用 AES-256 加密，服务器无法解密内容
- **助记词恢复**：BIP39 标准，12个单词即可恢复同步链
- **实时同步**：WebSocket 实现多设备即时同步
- **大文件支持**：分块传输，支持最大 5MB 内容
- **离线支持**：离线队列，网络恢复后自动同步
- **多笔记管理**：支持创建多个笔记和笔记本
- **深色模式**：护眼的深色主题
- **国际化**：支持中英文界面

## 📁 仓库结构

```
brave-sync-notes/
├── apps/
│   ├── web/               # React + Vite 前端
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── store/         # Zustand 状态管理
│   │   └── utils/         # 工具函数
│   └── tests/             # 测试文件
│   └── api/               # Express + Socket.IO 后端
│   ├── src/
│   │   ├── persistence/   # 持久化存储
│   │   └── utils/         # 工具函数
│   └── tests/             # 测试文件
└── docs/                   # GitHub Pages 文档站
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
cd apps/web
npm test

# 后端测试
cd apps/api
npm test

# 测试覆盖率
npm run test:coverage
```

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本历史。

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

## 📄 许可

[MIT License](LICENSE)
