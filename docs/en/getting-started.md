---
layout: default
title: Getting Started
description: Complete guide to installing, configuring, and running Note Sync Now
permalink: /docs/en/getting-started/
lang: en
---

# Getting Started with Note Sync Now

This guide will walk you through installing, configuring, and running Note Sync Now on your local machine.

---

## 🌐 Language / 语言

[English](./) | [简体中文](../zh-CN/getting-started.md)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Node.js | 18+ (20 LTS recommended) | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Included with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |

Optional for production-like environment:
- Redis 7+ ([redis.io](https://redis.io/))

### Verify Installations

```bash
node --version  # Should show v18+ or v20+
npm --version   # Should show 9+
git --version   # Any version
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/LessUp/brave-sync-notes.git
cd brave-sync-notes
```

### 2. Start the Server

```bash
cd apps/api
npm ci
node index.js
```

You should see:
```
Server listening on port 3002
Storage: sqlite (fallback: memory)
Health check available at http://localhost:3002/health
```

### 3. Start the Client (New Terminal)

```bash
cd apps/web
npm ci
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 4. Open in Browser

Navigate to `http://localhost:5173` in your browser.

---

## 🔧 Detailed Setup

### Server Configuration

#### Environment Variables

Create a `.env` file in `apps/api/`:

```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# CORS (for development, client runs on port 5173)
CORS_ORIGIN=http://localhost:5173

# Storage Configuration
PRIMARY_STORAGE=sqlite
FALLBACK_STORAGE=memory
SQLITE_DB_PATH=./data/sync.db

# Room Configuration
ROOM_TTL_MS=3600000
MAX_MEMORY_ROOMS=10000

# Redis Configuration (optional)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0
```

#### Storage Options

| Storage | Use Case | Configuration |
|---------|----------|---------------|
| Memory | Development, testing | `PRIMARY_STORAGE=memory` |
| SQLite | Single-server deployment | `PRIMARY_STORAGE=sqlite` |
| Redis | Multi-server, production | `PRIMARY_STORAGE=redis` |

### Client Configuration

Create a `.env` file in `apps/web/`:

```bash
# For development, this is optional (defaults to localhost:3002)
# VITE_SOCKET_URL=http://localhost:3002
```

---

## 📁 Project Structure

```
brave-sync-notes/
├── apps/
│   ├── web/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/  # React UI components
│   │   │   ├── hooks/       # Custom React hooks (useSocket, etc.)
│   │   │   ├── store/       # Zustand state management
│   │   │   └── utils/       # Utilities (crypto, conflict, storage)
│   │   ├── public/          # Static assets
│   │   ├── tests/           # Test files
│   │   ├── index.html       # HTML entry point
│   │   ├── package.json     # Client dependencies
│   │   └── vite.config.js   # Vite configuration
│   └── api/                  # Express + Socket.IO backend
│       ├── src/
│       │   └── persistence/ # Storage adapters (Redis, SQLite, Memory)
│       ├── tests/           # Test files
│       ├── index.js         # Server entry point
│       ├── package.json     # Server dependencies
│       └── .env.example     # Environment template
├── docs/                     # Documentation (this site)
├── changelog/                # Version history
└── .github/workflows/        # CI/CD automation
```

---

## 🧪 Running Tests

### Server Tests

```bash
cd brave-sync-notes/server

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run property-based tests
npm run test:property

# Watch mode
npm test -- --watch
```

### Client Tests

```bash
cd brave-sync-notes/client

# Run all tests
npm test -- --run

# Run in watch mode
npm test

# Run with UI
npm test -- --ui
```

---

## 🎯 Your First Sync

### 1. Create a New Sync Chain

1. Open the application at `http://localhost:5173`
2. You will see a 12-word mnemonic (e.g., "abandon ability able about...")
3. **Save this mnemonic securely** - it's your only recovery method
4. Click "Create Room" or "Join"

### 2. Join from Another Device/Browser

1. Open a new browser window or incognito mode
2. Navigate to the same URL
3. Enter the same 12-word mnemonic
4. Click "Join Room"

### 3. Test Synchronization

1. Type in one browser
2. Watch the content appear in the other browser in real-time
3. Try disconnecting and reconnecting - your content persists

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: Port 3002 (or 5173) is already in use

# Solution 1: Kill the process using the port
lsof -ti:3002 | xargs kill -9

# Solution 2: Use a different port
PORT=3003 node index.js  # Server
npm run dev -- --port=5174  # Client
```

#### CORS Errors

```bash
# Error: Access-Control-Allow-Origin header

# Solution: Ensure CORS_ORIGIN matches your client URL
# In server/.env:
CORS_ORIGIN=http://localhost:5173
```

#### npm Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm ci
```

#### Node Version Issues

```bash
# Use nvm to switch Node versions
nvm install 20
nvm use 20
```

### Getting Help

- Check the [Architecture Guide](./architecture.md) for system understanding
- Review [Security & Synchronization](./security-sync.md) for encryption details
- Visit [GitHub Issues](https://github.com/LessUp/brave-sync-notes/issues) for known problems

---

## 🎓 Next Steps

### Learn More

1. [Architecture Overview](./architecture.md) - Understand how the system works
2. [Security & Synchronization](./security-sync.md) - Learn about encryption and sync
3. [Deployment Guide](./deployment.md) - Deploy to production

### Customize

- Modify the theme: Edit `apps/web/src/styles/`
- Add features: Extend `apps/api/src/`
- Change storage: Configure different persistence adapters

### Contribute

- Read the [Contributing Guide](./contributing.md)
- Check out open [GitHub Issues](https://github.com/LessUp/brave-sync-notes/issues)
- Join [GitHub Discussions](https://github.com/LessUp/brave-sync-notes/discussions)

---

## 📚 Additional Resources

| Resource | Description |
|----------|-------------|
| [React Documentation](https://react.dev/) | Learn React |
| [Vite Documentation](https://vitejs.dev/) | Build tool used for client |
| [Socket.IO](https://socket.io/) | Real-time communication library |
| [Zustand](https://docs.pmnd.rs/zustand) | State management |
| [Keep a Changelog](https://keepachangelog.com/) | Changelog format |

---

*Last updated: 2026-04-16*
