---
layout: default
title: 快速入门指南
description: 安装、配置和运行 Note Sync Now 的完整指南
permalink: /docs/zh-CN/getting-started/
lang: zh-CN
---

# Note Sync Now 快速入门指南

本指南将引导您在本地机器上安装、配置和运行 Note Sync Now。

---

## 🌐 语言 / Language

[English](../en/getting-started.md) | [简体中文](./)

---

## 📋 前置要求

开始之前，请确保您已安装以下软件：

| 要求 | 版本 | 安装方式 |
|-------------|---------|--------------|
| Node.js | 18+（推荐 20 LTS） | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | 随 Node.js 附带 |
| Git | 任意版本 | [git-scm.com](https://git-scm.com/) |

生产环境模拟可选：
- Redis 7+ ([redis.io](https://redis.io/))

### 验证安装

```bash
node --version  # 应显示 v18+ 或 v20+
npm --version   # 应显示 9+
git --version   # 任意版本
```

---

## 🚀 快速开始（5 分钟）

### 1. 克隆仓库

```bash
git clone https://github.com/LessUp/brave-sync-notes.git
cd brave-sync-notes
```

### 2. 启动服务端

```bash
cd apps/api
npm ci
node index.js
```

您应该会看到：
```
Server listening on port 3002
Storage: sqlite (fallback: memory)
Health check available at http://localhost:3002/health
```

### 3. 启动客户端（新建终端）

```bash
cd apps/web
npm ci
npm run dev
```

您应该会看到：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 4. 在浏览器中打开

在浏览器中访问 `http://localhost:5173`。

---

## 🔧 详细设置

### 服务端配置

#### 环境变量

在 `apps/api/` 中创建 `.env` 文件：

```bash
# 服务端配置
PORT=3002
NODE_ENV=development

# CORS（开发环境，客户端运行在 5173 端口）
CORS_ORIGIN=http://localhost:5173

# 存储配置
PRIMARY_STORAGE=sqlite
FALLBACK_STORAGE=memory
SQLITE_DB_PATH=./data/sync.db

# 房间配置
ROOM_TTL_MS=3600000
MAX_MEMORY_ROOMS=10000

# Redis 配置（可选）
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0
```

#### 存储选项

| 存储 | 使用场景 | 配置 |
|---------|----------|---------------|
| Memory | 开发、测试 | `PRIMARY_STORAGE=memory` |
| SQLite | 单服务器部署 | `PRIMARY_STORAGE=sqlite` |
| Redis | 多服务器、生产环境 | `PRIMARY_STORAGE=redis` |

### 客户端配置

在 `apps/web/` 中创建 `.env` 文件：

```bash
# 开发环境此项为可选（默认 localhost:3002）
# VITE_SOCKET_URL=http://localhost:3002
```

---

## 📁 项目结构

```
brave-sync-notes/
├── apps/
│   ├── web/                  # React + Vite 前端
│   │   ├── src/
│   │   │   ├── components/  # React UI 组件
│   │   │   ├── hooks/       # 自定义 React hooks（useSocket 等）
│   │   │   ├── store/       # Zustand 状态管理
│   │   │   └── utils/       # 工具函数（加密、冲突、存储）
│   │   ├── public/          # 静态资源
│   │   ├── tests/           # 测试文件
│   │   ├── index.html       # HTML 入口
│   │   ├── package.json     # 客户端依赖
│   │   └── vite.config.js   # Vite 配置
│   └── api/                  # Express + Socket.IO 后端
│       ├── src/
│       │   └── persistence/ # 存储适配器（Redis、SQLite、Memory）
│       ├── tests/           # 测试文件
│       ├── index.js         # 服务端入口
│       ├── package.json     # 服务端依赖
│       └── .env.example     # 环境模板
├── docs/                     # 文档（本站）
├── changelog/                # 版本历史
└── .github/workflows/        # CI/CD 自动化
```

---

## 🧪 运行测试

### 服务端测试

```bash
cd brave-sync-notes/server

# 运行所有测试
npm test

# 带覆盖率运行
npm test -- --coverage

# 运行基于属性的测试
npm run test:property

# 监视模式
npm test -- --watch
```

### 客户端测试

```bash
cd brave-sync-notes/client

# 运行所有测试
npm test -- --run

# 监视模式运行
npm test

# 带 UI 运行
npm test -- --ui
```

---

## 🎯 您的第一次同步

### 1. 创建新的同步链

1. 在浏览器中打开应用 `http://localhost:5173`
2. 您会看到一个 12 词助记词（例如："abandon ability able about..."）
3. **安全保存此助记词** - 它是您唯一的恢复方式
4. 点击"创建房间"或"加入"

### 2. 从另一个设备/浏览器加入

1. 新建浏览器窗口或无痕模式
2. 导航到相同的 URL
3. 输入相同的 12 词助记词
4. 点击"加入房间"

### 3. 测试同步

1. 在一个浏览器中输入内容
2. 观察内容实时出现在另一个浏览器中
3. 尝试断开并重新连接 - 您的内容会持久保存

---

## 🐛 故障排除

### 常见问题

#### 端口已被占用

```bash
# 错误：端口 3002（或 5173）已被占用

# 方案 1：终止占用端口的进程
lsof -ti:3002 | xargs kill -9

# 方案 2：使用不同端口
PORT=3003 node index.js  # 服务端
npm run dev -- --port=5174  # 客户端
```

#### CORS 错误

```bash
# 错误：Access-Control-Allow-Origin 请求头

# 解决方案：确保 CORS_ORIGIN 与客户端 URL 匹配
# 在 server/.env 中：
CORS_ORIGIN=http://localhost:5173
```

#### npm 安装问题

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm ci
```

#### Node 版本问题

```bash
# 使用 nvm 切换 Node 版本
nvm install 20
nvm use 20
```

### 获取帮助

- 查看[架构指南](./architecture.md)了解系统工作原理
- 查看[安全与同步机制](./security-sync.md)了解加密详情
- 访问 [GitHub Issues](https://github.com/LessUp/brave-sync-notes/issues) 了解已知问题

---

## 🎓 下一步

### 了解更多

1. [架构说明](./architecture.md) - 了解系统工作原理
2. [安全与同步机制](./security-sync.md) - 了解加密和同步
3. [部署指南](./deployment.md) - 部署到生产环境

### 自定义

- 修改主题：编辑 `apps/web/src/styles/`
- 添加功能：扩展 `apps/api/src/`
- 更改存储：配置不同的持久化适配器

### 贡献

- 阅读[贡献指南](./contributing.md)
- 查看开放的 [GitHub Issues](https://github.com/LessUp/brave-sync-notes/issues)
- 加入 [GitHub Discussions](https://github.com/LessUp/brave-sync-notes/discussions)

---

## 📚 额外资源

| 资源 | 描述 |
|----------|-------------|
| [React 文档](https://react.dev/) | 学习 React |
| [Vite 文档](https://vitejs.dev/) | 客户端构建工具 |
| [Socket.IO](https://socket.io/) | 实时通信库 |
| [Zustand](https://docs.pmnd.rs/zustand) | 状态管理 |
| [Keep a Changelog](https://keepachangelog.com/) | 更新日志格式 |

---

*最后更新：2026-04-16*
