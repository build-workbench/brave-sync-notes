# Note Sync Now / 安全同步笔记

[English](README.md) | 简体中文 | [文档站](https://lessup.github.io/brave-sync-notes/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)

Note Sync Now 是一个端到端加密笔记同步项目，用于探索助记词恢复、实时协作与隐私优先的多设备同步体验。

## 仓库概览

- `brave-sync-notes/client`：React + Vite 前端
- `brave-sync-notes/server`：Express + Socket.IO 后端
- 客户端侧 AES-256 加密与助记词恢复流程
- GitHub Pages 文档站负责项目导读、阅读路径与部署背景说明

## 快速开始

```bash
cd brave-sync-notes/server
npm install
node index.js

cd ../client
npm install
npm run dev
```

后端默认监听 `http://localhost:3002`，前端开发服务通常运行在 `http://localhost:5173`。

## 文档

- 项目文档：`https://lessup.github.io/brave-sync-notes/`
- 站点首页提供项目定位、阅读路径与部署上下文
- 参与协作请查看 `CONTRIBUTING.md`

## 许可

MIT License
