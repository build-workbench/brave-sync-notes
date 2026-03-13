---
layout: default
title: Note Sync Now
description: 端到端加密笔记同步工具的文档入口：项目定位、阅读路径与关键页面导航
---

# Note Sync Now

[![GitHub Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)

Note Sync Now 面向“无需账号、保持私密、支持多设备实时同步”的笔记协作场景：客户端负责助记词恢复与端到端加密，服务端只转发加密后的同步数据。

## 项目定位

这是一个把隐私优先同步、实时协作体验和可维护工程结构放在一起的实验项目。仓库首页只保留最小启动信息，这个页面负责说明它是什么、适合谁以及应该从哪里开始阅读。

## 适合谁

- 想了解助记词恢复与客户端侧加密同步流程的开发者
- 想参考 React + Express + Socket.IO 协作型应用拆分方式的工程师
- 需要快速定位部署、贡献与历史变更入口的维护者

## 从哪里开始

1. 先看 [README](README.md)，完成本地启动。
2. 再看 [CONTRIBUTING](CONTRIBUTING.md)，了解开发与协作约定。
3. 想了解历史演进和部署相关调整时，继续查看 [更新日志](changelog/)。

## 推荐阅读路径

### 我只想把项目跑起来

- [README](README.md)
- [CONTRIBUTING](CONTRIBUTING.md)

### 我想理解系统边界

- [README](README.md)
- `brave-sync-notes/client`
- `brave-sync-notes/server`

### 我准备继续维护

- [CONTRIBUTING](CONTRIBUTING.md)
- [更新日志](changelog/)
- [GitHub 仓库](https://github.com/LessUp/brave-sync-notes)

## 核心入口

| 类别 | 页面 | 说明 |
|------|------|------|
| 概览 | [README](README.md) | 仓库定位、最小启动命令与文档链接 |
| 快速开始 | [README](README.md) | 前后端本地开发启动方式 |
| 开发指南 | [CONTRIBUTING](CONTRIBUTING.md) | 开发流程、代码规范与提交约定 |
| 归档 | [更新日志](changelog/) | Pages、部署与功能迭代记录 |
| 外部链接 | [GitHub 仓库](https://github.com/LessUp/brave-sync-notes) | 源码、Issue 与协作入口 |
