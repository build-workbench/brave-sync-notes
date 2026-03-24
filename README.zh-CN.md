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

Note Sync Now 是一个端到端加密笔记同步项目，用于探索助记词恢复、实时协作与隐私优先的多设备同步体验。

## 仓库概览

- `brave-sync-notes/client`：React + Vite 前端
- `brave-sync-notes/server`：Express + Socket.IO 后端
- 客户端侧 AES-256 加密与助记词恢复流程
- GitHub Pages 文档站负责项目导读、架构说明、部署说明与更新归档

## 快速开始

```bash
cd brave-sync-notes/server
npm ci
node index.js

cd ../client
npm ci
npm run dev
```

后端默认监听 `http://localhost:3002`，前端开发服务通常运行在 `http://localhost:5173`。

## 文档入口

- 项目首页：<https://lessup.github.io/brave-sync-notes/>
- 部署与运行：<https://lessup.github.io/brave-sync-notes/deployment/>
- 贡献指南：<https://lessup.github.io/brave-sync-notes/contributing/>

## 推荐阅读路径

1. 先看文档站首页了解整体入口。
2. 再看架构说明理解前后端边界与同步链路。
3. 修改部署或工作流前先看部署与运行页。
4. 提交改动前查看贡献指南与更新日志约定。

## 许可

MIT License
