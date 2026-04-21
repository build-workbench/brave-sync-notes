---
layout: default
title: Note Sync Now 文档中心
description: 端到端加密笔记同步工具 - 文档门户
permalink: /docs/zh-CN/
lang: zh-CN
---

# Note Sync Now 文档中心

[![GitHub Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/docs.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/docs.yml)
[![CI](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/LessUp/brave-sync-notes/blob/main/LICENSE)

**端到端加密** | **实时同步** | **多设备协作** | **无需账号**

---

## 🌐 语言选择

[English](../en/) | [简体中文](./)

---

## 🚀 快速开始

```bash
# 启动服务端
cd apps/api && npm ci && node index.js

# 启动客户端（另一个终端）
cd apps/web && npm ci && npm run dev
```

- 服务端：`http://localhost:3002`
- 客户端：`http://localhost:5173`

详细设置说明请参见[快速入门指南](./getting-started.md)。

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [快速入门指南](./getting-started) | 详细的安装和设置指南 |
| [架构说明](./architecture) | 系统设计与模块关系 |
| [部署指南](./deployment) | 生产环境部署与配置 |
| [安全与同步机制](./security-sync) | 加密边界与同步流程 |
| [贡献指南](./contributing) | 开发流程与规范 |
| [API 参考](/api/) | WebSocket 和 REST API 文档 |

---

## ✨ 核心特性

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

- 服务端：Redis / SQLite
- 客户端：IndexedDB / LocalStorage
- 自动降级与回退

---

## 📖 推荐阅读路径

### 我想运行项目

1. [仓库概览](https://github.com/LessUp/brave-sync-notes) → 了解项目
2. [快速入门指南](./getting-started) → 本地开发设置

### 我想理解架构

1. [架构说明](./architecture) → 系统设计
2. [安全与同步机制](./security-sync) → 加密与同步详情

### 我想部署到生产环境

1. [部署指南](./deployment) → 生产环境配置
2. [API 参考](/api/) → 集成详情

### 我想参与贡献

1. [贡献指南](./contributing) → 开发规范
2. [更新日志](/changelog/) → 版本历史

---

## 🔗 快速链接

| 资源 | 链接 |
|------|------|
| GitHub 仓库 | https://github.com/LessUp/brave-sync-notes |
| 问题追踪 | https://github.com/LessUp/brave-sync-notes/issues |
| GitHub Pages 站点 | https://lessup.github.io/brave-sync-notes/ |
| 完整更新日志 | https://lessup.github.io/brave-sync-notes/changelog/ |

---

## 📂 项目结构

```
brave-sync-notes/
├── docs/                      # 文档
│   ├── en/                   # 英文文档
│   ├── zh-CN/                # 中文文档
│   └── api/                  # API 文档
├── apps/
│   ├── web/                  # React + Vite 前端
│   └── api/                  # Express + Socket.IO 后端
├── changelog/                 # 版本历史
├── README.md                  # 主仓库入口
└── _config.yml               # Jekyll 配置
```

---

## 📄 许可证

[MIT License](https://github.com/LessUp/brave-sync-notes/blob/main/LICENSE)

---

*最后更新：2026-04-16*
