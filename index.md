---
layout: default
title: Note Sync Now
description: 端到端加密笔记同步工具 - 项目文档入口
---

# Note Sync Now

[![GitHub Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml)
[![CI](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)

**端到端加密** | **实时同步** | **多设备协作** | **无需账号**

---

## 快速开始

```bash
# 启动服务端
cd brave-sync-notes/server && npm ci && node index.js

# 启动客户端 (另一个终端)
cd brave-sync-notes/client && npm ci && npm run dev
```

- 服务端: `http://localhost:3002`
- 客户端: `http://localhost:5173`

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [仓库概览]({{ '/overview/' | relative_url }}) | 项目定位与快速启动 |
| [架构说明]({{ '/architecture/' | relative_url }}) | 系统设计与模块关系 |
| [部署与运行]({{ '/deployment/' | relative_url }}) | 环境配置与部署要点 |
| [安全与同步]({{ '/security-sync/' | relative_url }}) | 加密边界与同步流程 |
| [贡献指南]({{ '/contributing/' | relative_url }}) | 开发流程与规范 |
| [更新日志]({{ '/changelog/' | relative_url }}) | 版本历史与变更 |

---

## 核心特性

### 🔐 端到端加密

- 客户端 AES-256 加密
- 服务端只转发密文，无法读取内容
- 12 词助记词恢复密钥

### ⚡ 实时同步

- WebSocket 双向通信
- 大文件自动分块传输
- 断线自动重连

### 🔄 冲突处理

- 智能冲突检测
- 三路合并算法
- 手动解决界面

### 💾 多层存储

- 服务端: Redis / SQLite
- 客户端: IndexedDB / LocalStorage
- 自动降级与回退

---

## 项目结构

```
brave-sync-notes/
├── client/                 # React + Vite 前端
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── hooks/         # React Hooks
│   │   ├── store/         # Zustand 状态
│   │   └── utils/         # 工具模块
│   └── package.json
├── server/                 # Express + Socket.IO 后端
│   ├── src/
│   │   └── persistence/   # 持久化层
│   └── package.json
└── docs/                   # 文档站
    ├── architecture.md
    ├── deployment.md
    └── ...
```

---

## 阅读路径

### 我想运行项目

1. [仓库概览]({{ '/overview/' | relative_url }}) → 了解项目
2. [部署与运行]({{ '/deployment/' | relative_url }}) → 本地启动

### 我想理解架构

1. [架构说明]({{ '/architecture/' | relative_url }}) → 系统设计
2. [安全与同步]({{ '/security-sync/' | relative_url }}) → 加密与同步

### 我想参与开发

1. [贡献指南]({{ '/contributing/' | relative_url }}) → 开发规范
2. [更新日志]({{ '/changelog/' | relative_url }}) → 变更历史

---

## 链接

- [GitHub 仓库](https://github.com/LessUp/brave-sync-notes)
- [Issue 追踪](https://github.com/LessUp/brave-sync-notes/issues)
