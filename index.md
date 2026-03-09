---
layout: default
title: Note Sync Now
---

# Note Sync Now / 安全同步笔记

端到端加密笔记同步工具 — 使用 12 个单词的同步密钥在多设备间同步笔记，无需账号，保护隐私。

## 核心特性

- **端到端加密** — AES-256 加密 + 12-word 助记词链码
- **实时同步** — WebSocket 多设备即时同步
- **无需账号** — 隐私优先设计，无数据采集
- **离线可用** — 本地存储持久化

### 编辑器

- **CodeMirror** — 专业代码编辑器，语法高亮
- **Markdown** — 完整 GFM 支持，实时预览
- **分屏视图** — 编辑与预览并排显示

### 移动端

- **二维码分享** — 扫码加入同步链
- **响应式设计** — 完全适配移动设备
- **触控优化** — 大触摸目标和手势支持

### 界面

- **深色/浅色主题** — 跟随系统 + 手动切换
- **中英双语** — 完整的英文和中文界面
- **现代设计** — 毛玻璃效果、流畅动画

## 快速开始

```bash
# 客户端
cd brave-sync-notes/client
npm install && npm run dev

# 服务端
cd brave-sync-notes/server
npm install && npm run dev
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 18, Vite 5, CodeMirror |
| 后端 | Express 4, Socket.IO 4 |
| 加密 | AES-256, Web Crypto API |
| 样式 | Tailwind CSS |

## 链接

- [GitHub 仓库](https://github.com/LessUp/sync-notes)
- [README](README.md)
