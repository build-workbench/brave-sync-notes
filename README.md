<div align="center">

# Note Sync Now / Brave Sync Notes

<p align="center">
  <strong>End-to-End Encrypted Note Synchronization</strong>
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
  <a href="https://lessup.github.io/brave-sync-notes/">📚 Documentation</a> •
  <a href="https://lessup.github.io/brave-sync-notes/overview/">🏠 Project Home</a> •
  <a href="https://github.com/LessUp/brave-sync-notes/releases">📦 Releases</a> •
  <a href="./CONTRIBUTING.md">🤝 Contributing</a>
</p>

<p align="center">
  <b>English</b> | <a href="./README.zh-CN.md">简体中文</a>
</p>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 End-to-End Encryption
- Client-side AES-256-GCM encryption
- Server only relays ciphertext
- 12-word mnemonic recovery

### ⚡ Real-time Sync
- WebSocket + Socket.IO
- Automatic chunked transfer (>50KB)
- Smart reconnection

</td>
<td width="50%">

### 🔄 Conflict Resolution
- Three-way merge algorithm
- Manual resolution UI
- Version tracking

### 💾 Multi-Layer Storage
- Server: Redis / SQLite / Memory
- Client: IndexedDB / LocalStorage
- Automatic fallback

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 LTS recommended)
- [npm](https://www.npmjs.com/) 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/LessUp/brave-sync-notes.git
cd brave-sync-notes

# 2. Start the server
cd apps/api && npm ci && node index.js

# 3. Start the client (new terminal)
cd apps/web && npm ci && npm run dev
```

**Access the application:**
- Client: http://localhost:5173
- Server: http://localhost:3002

For detailed setup instructions, see our [Getting Started Guide](./docs/en/getting-started.md).

---

## 📖 Documentation

We provide comprehensive documentation in both **English** and **简体中文**.

### Specifications (Single Source of Truth)

| Spec | Description |
|------|-------------|
| [Product Requirements](./specs/product/note-sync-system.md) | Feature definitions & acceptance criteria |
| [Core Architecture](./specs/rfc/0001-core-architecture.md) | System design & technical decisions |
| [API Specification](./specs/api/websocket-api.yaml) | WebSocket & REST API definitions |
| [Database Schema](./specs/db/schema-v1.dbml) | Data models & storage structure |
| [Testing Strategy](./specs/testing/test-strategy.md) | Test frameworks & correctness properties |

### User & Developer Guides

#### English Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/en/getting-started.md) | Complete installation and setup guide |
| [Architecture](./docs/en/architecture.md) | System design and data flow |
| [Deployment](./docs/en/deployment.md) | Production deployment guide |
| [Security](./docs/en/security-sync.md) | Encryption and synchronization |
| [Contributing](./docs/en/contributing.md) | Development guidelines |
| [API Reference](./docs/api/) | WebSocket and REST API docs |

### 中文文档

| 文档 | 说明 |
|------|------|
| [快速入门](./docs/zh-CN/getting-started.md) | 完整安装和设置指南 |
| [架构说明](./docs/zh-CN/architecture.md) | 系统设计与数据流 |
| [部署指南](./docs/zh-CN/deployment.md) | 生产环境部署指南 |
| [安全机制](./docs/zh-CN/security-sync.md) | 加密与同步机制 |
| [贡献指南](./docs/zh-CN/contributing.md) | 开发规范 |
| [API 参考](./docs/api/) | WebSocket 和 REST API 文档 |

**Full Documentation Site**: https://lessup.github.io/brave-sync-notes/

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Browser A  │◄──►│  Browser B  │◄──►│  Mobile App │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│  [React + Vite]      [Zustand State]   [AES-256 Crypto]    │
└─────────┬──────────────────┬──────────────────┬─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Express + Socket.IO                                   │  │
│  │  • Room Management                                     │  │
│  │  • Event Distribution                                  │  │
│  │  • Rate Limiting                                       │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼──────────────────┐                   │
│  │      Persistence Layer              │                   │
│  │  ┌──────────┐ ┌──────────┐         │                   │
│  │  │  Redis   │ │  SQLite  │ (Fallback)                  │
│  │  └──────────┘ └──────────┘         │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

For detailed architecture, see [Architecture Documentation](./docs/en/architecture.md).

---

## 🛠️ Development

### Testing

```bash
# Client tests
cd apps/web && npm test -- --run

# Server tests
cd apps/api && npm test

# Property-based tests
cd apps/api && npm run test:property
```

### Project Structure

```
brave-sync-notes/
├── apps/
│   ├── web/             # React + Vite frontend
│   │   ├── src/         # Source code
│   │   └── tests/       # Test files
│   └── api/             # Express + Socket.IO backend
│       ├── src/         # Source code
│       └── tests/       # Test files
├── docs/                # Documentation (EN/ZH)
├── changelog/           # Version history
└── .github/workflows/   # CI/CD configuration
```

---

## 📊 Project Status

| Metric | Status |
|--------|--------|
| Latest Version | [v2.2.0](https://github.com/LessUp/brave-sync-notes/releases/tag/v2.2.0) |
| Build Status | ![CI](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml/badge.svg) |
| Documentation | ![Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml/badge.svg) |
| License | [MIT](./LICENSE) |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/en/contributing.md) for details.

Quick links:
- [Report a Bug](https://github.com/LessUp/brave-sync-notes/issues/new)
- [Request a Feature](https://github.com/LessUp/brave-sync-notes/discussions)
- [View Issues](https://github.com/LessUp/brave-sync-notes/issues)

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

```
MIT License

Copyright (c) 2026 LessUp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

- [React](https://react.dev/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Socket.IO](https://socket.io/) - Real-time communication
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Express](https://expressjs.com/) - Web framework

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/LessUp">LessUp</a>
</p>

<p align="center">
  <a href="https://lessup.github.io/brave-sync-notes/">🌐 Website</a> •
  <a href="https://github.com/LessUp">👥 GitHub</a>
</p>
