---
layout: default
title: Note Sync Now
---

# Note Sync Now

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

A secure, end-to-end encrypted note synchronization tool with real-time collaboration. Sync notes across devices using a **12-word mnemonic chain code** — no accounts, no tracking, no server-side plaintext.

## Key Features

### Security & Sync
- **End-to-End Encryption** — AES-256 with a 12-word mnemonic-derived key; the server never sees plaintext
- **Real-Time Sync** — Instant multi-device synchronization via WebSocket (Socket.IO)
- **No Accounts** — Privacy-first design with zero data collection
- **Offline-Ready** — Local storage persistence; works without network

### Editor
- **CodeMirror Integration** — Professional code editor with syntax highlighting for 10+ languages
- **Markdown Support** — Full GFM with live preview in split-pane mode
- **Version History** — Auto-save with restore to previous versions
- **Import/Export** — Support for `.md` and `.txt` files

### Mobile & UX
- **QR Code Sharing** — Scan to join a sync chain from any mobile device
- **Responsive Design** — Fully optimized for phones and tablets
- **Dark/Light Themes** — System-aware with manual toggle
- **Bilingual UI** — Complete English and Chinese interface
- **Glass Morphism** — Modern design with smooth animations

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   Client  (React + Vite)                  │
│  CodeMirror ─── Markdown Preview ─── Theme / i18n         │
│       │                                                   │
│   AES-256 Encrypt ◄──── 12-word mnemonic ────►  Decrypt   │
│       │                                          │        │
└───────┼──────────────────────────────────────────┼────────┘
        │  WebSocket (encrypted payloads only)     │
┌───────▼──────────────────────────────────────────▼────────┐
│                 Server  (Express + Socket.IO)             │
│        Relay encrypted blobs — zero knowledge             │
└───────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Backend
cd brave-sync-notes/server
npm install && node index.js    # → http://localhost:3002

# Frontend
cd brave-sync-notes/client
npm install && npm run dev      # → http://localhost:5173
```

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| **Frontend** | Netlify | Set `VITE_SOCKET_URL` env var |
| **Backend** | Any VPS | Run with pm2 or systemd behind Nginx + HTTPS |

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, Vite 5, CodeMirror 6 |
| Backend | Express 4, Socket.IO 4 |
| Encryption | AES-256-GCM, Web Crypto API |
| Styling | Tailwind CSS |
| CI | GitHub Actions (build + lint) |

---

[View on GitHub](https://github.com/LessUp/sync-notes) · [README](README.md)
