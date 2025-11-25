# Note Sync Now / 安全同步笔记

A modern, secure, end-to-end encrypted note synchronization tool with real-time collaboration features. Synchronize notes across devices using a 12-word chain code - no accounts, no tracking.

一个现代化的端到端加密笔记同步工具，支持实时协作。使用 12 个单词的同步密钥在多设备间同步笔记，无需账号，保护隐私。

## Features / 功能特点

### Core Features / 核心功能
- **End-to-end Encryption** - AES-256 encryption with 12-word mnemonic chain code
- **Real-time Sync** - Instant synchronization across multiple devices via WebSocket
- **No Accounts, No Tracking** - Privacy-first design with no data collection
- **Offline-ready** - Local storage persistence for seamless experience

### Editor / 编辑器
- **CodeMirror Integration** - Professional code editor with syntax highlighting
- **Markdown Support** - Full GFM (GitHub Flavored Markdown) with live preview
- **Split View** - Edit and preview side-by-side
- **Code Highlighting** - 10+ programming languages supported

### Mobile & Accessibility / 移动端支持
- **QR Code Sharing** - Scan QR code to join sync chain from mobile
- **Responsive Design** - Fully optimized for mobile devices
- **Touch Optimized** - Large touch targets and gestures support

### History & Management / 历史记录
- **Version History** - Auto-save and restore previous versions
- **Import/Export** - Support for .md and .txt files
- **Settings Persistence** - All preferences saved locally

### UI/UX / 界面体验
- **Dark/Light Themes** - System-aware theme with manual toggle
- **Bilingual UI** - Full English and Chinese interface
- **Modern Design** - Glass morphism, smooth animations

## Project structure

Repository root:

- `brave-sync-notes/client/` – Vite + React frontend
- `brave-sync-notes/server/` – Express + Socket.IO backend

## Getting started (local development)

### Backend (server)

```bash
cd brave-sync-notes/server
npm install
node index.js
```

By default the server listens on port `3002` or `process.env.PORT` if provided.

### Frontend (client)

```bash
cd brave-sync-notes/client
npm install
npm run dev
```

Vite will start a dev server (typically on `http://localhost:5173`).

## Configuration

The frontend connects to the backend via `SOCKET_URL`:

```js
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
```

For production deployments, set `VITE_SOCKET_URL` in your environment to the public URL of your backend.

### Example

- Local development: `VITE_SOCKET_URL` *unset* (falls back to `http://localhost:3002`).
- Production: `VITE_SOCKET_URL=https://your-sync-server.example.com`.

## Deployment

### 1. Frontend on Netlify

You can deploy the frontend directly from this repo with Netlify.

1. Connect the GitHub repository to Netlify.
2. Use the following build settings:
   - **Base directory**: `brave-sync-notes/client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. In Netlify environment variables, set:
   - `VITE_SOCKET_URL=https://your-sync-server.example.com`

A sample `netlify.toml` is provided under `brave-sync-notes/client/`.

### 2. Backend on a VPS (Node.js)

On your VPS (Ubuntu/Debian-style example):

```bash
# Clone or upload the repository
cd /path/to/Note-Sync-Now/brave-sync-notes/server

npm install
PORT=3002 NODE_ENV=production node index.js
```

For production, you should run the server under a process manager (e.g. `pm2`, `systemd`). A simple helper script is provided as `brave-sync-notes/server/start-local.sh`.

#### Example `pm2` command

```bash
cd /path/to/Note-Sync-Now/brave-sync-notes/server
npm install
pm2 start index.js --name brave-sync-notes --env production
```

Ensure your firewall / reverse proxy exposes the chosen port via HTTPS (e.g. Nginx + Letnt's Encrypt).

## Scripts

### Client

- `npm run dev` – Start Vite dev server.
- `npm run build` – Build production assets.
- `npm run preview` – Preview built site locally.

### Server

- `node index.js` – Start the Socket.IO/Express server.

## Open source & contributions

This project is intended to be open-sourced.

- See `LICENSE` for licensing details.
- See `CONTRIBUTING.md` for guidelines on issues, pull requests, and code style.

## CI / CD

Basic GitHub Actions workflows are provided under `.github/workflows/` to run installs and builds for both the client and server on each push / pull request. You can extend these workflows with tests or deployment steps as the project evolves.
