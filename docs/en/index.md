---
layout: default
title: Note Sync Now Documentation
description: End-to-end encrypted note synchronization - Documentation portal
permalink: /docs/en/
lang: en
---

# Note Sync Now Documentation

[![GitHub Pages](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/pages.yml)
[![CI](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/brave-sync-notes/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**End-to-End Encryption** | **Real-time Sync** | **Multi-Device Collaboration** | **No Account Required**

---

## 🌐 Language Selection

[English](./) | [简体中文](../zh-CN/)

---

## 🚀 Quick Start

```bash
# Start the server
cd brave-sync-notes/server && npm ci && node index.js

# Start the client (another terminal)
cd brave-sync-notes/client && npm ci && npm run dev
```

- Server: `http://localhost:3002`
- Client: `http://localhost:5173`

For detailed setup instructions, see [Getting Started](./getting-started.md).

---

## 📚 Documentation Navigation

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Detailed installation and setup guide |
| [Architecture Overview](./architecture.md) | System design and module relationships |
| [Deployment Guide](./deployment.md) | Production deployment and configuration |
| [Security & Synchronization](./security-sync.md) | Encryption boundaries and sync mechanisms |
| [Contributing Guide](./contributing.md) | Development workflow and standards |
| [API Reference](../api/) | WebSocket and REST API documentation |

---

## ✨ Core Features

### 🔐 End-to-End Encryption

- Client-side AES-256 encryption
- Server only relays ciphertext, cannot read content
- 12-word mnemonic recovery key

### ⚡ Real-time Synchronization

- WebSocket bidirectional communication
- Automatic chunked transfer for large files
- Automatic reconnection on disconnect

### 🔄 Conflict Resolution

- Intelligent conflict detection
- Three-way merge algorithm
- Manual resolution interface

### 💾 Multi-Layer Storage

- Server-side: Redis / SQLite
- Client-side: IndexedDB / LocalStorage
- Automatic degradation and fallback

---

## 📖 Reading Paths

### I Want to Run the Project

1. [Repository Overview](../../README.md) → Understand the project
2. [Getting Started](./getting-started.md) → Local development setup

### I Want to Understand the Architecture

1. [Architecture Overview](./architecture.md) → System design
2. [Security & Synchronization](./security-sync.md) → Encryption and sync details

### I Want to Deploy to Production

1. [Deployment Guide](./deployment.md) → Production configuration
2. [API Reference](../api/) → Integration details

### I Want to Contribute

1. [Contributing Guide](./contributing.md) → Development standards
2. [Changelog](../../changelog/) → Version history

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/LessUp/brave-sync-notes |
| Issue Tracker | https://github.com/LessUp/brave-sync-notes/issues |
| GitHub Pages Site | https://lessup.github.io/brave-sync-notes/ |
| Full Changelog | https://lessup.github.io/brave-sync-notes/changelog/ |

---

## 📂 Project Structure

```
brave-sync-notes/
├── docs/                      # Documentation
│   ├── en/                   # English documentation
│   ├── zh-CN/                # Chinese documentation
│   └── api/                  # API documentation
├── brave-sync-notes/
│   ├── client/               # React + Vite frontend
│   └── server/               # Express + Socket.IO backend
├── changelog/                 # Version history
├── README.md                  # Main repository entry
└── _config.yml               # Jekyll configuration
```

---

## 📄 License

[MIT License](../../LICENSE)

---

*Last updated: 2026-04-16*
