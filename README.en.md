# Note Sync Now

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)

[简体中文](README.md) | English

End-to-end encrypted note synchronization — AES-256 encryption, 12-word mnemonic recovery, real-time collaboration via WebSocket.

## Features

- **E2E Encryption** — AES-256-GCM, keys never leave the client
- **Mnemonic Recovery** — BIP39-style 12-word seed phrase for key backup
- **Real-Time Sync** — WebSocket-based instant synchronization
- **Offline Support** — Local-first with conflict resolution on reconnect
- **Markdown Editor** — Rich text editing with live preview
- **Multi-Device** — Sync across browsers/devices via mnemonic

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express + Socket.IO
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Storage**: IndexedDB (client) + SQLite (server)

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

## How It Works

1. **Generate or Import** a 12-word mnemonic phrase
2. **Derive encryption key** from mnemonic using PBKDF2
3. **Create/edit notes** — encrypted locally before sync
4. **Real-time sync** — encrypted blobs transmitted via WebSocket
5. **Multi-device** — import same mnemonic on another device to decrypt

## Security Model

- Keys derived client-side from mnemonic, never sent to server
- Server only stores encrypted blobs — zero-knowledge architecture
- AES-256-GCM with unique IV per encryption operation

## License

MIT License
