# Note Sync Now

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)

English | [简体中文](README.zh-CN.md) | [Docs](https://lessup.github.io/brave-sync-notes/)

Note Sync Now is an end-to-end encrypted note synchronization project for experimenting with mnemonic-based recovery, real-time collaboration, and privacy-first multi-device sync.

## Repository Overview

- React + Vite client in `brave-sync-notes/client`
- Express + Socket.IO server in `brave-sync-notes/server`
- AES-256-based client-side encryption with mnemonic recovery flow
- GitHub Pages site for architecture, usage paths, and project updates

## Quick Start

```bash
cd brave-sync-notes/server
npm install
node index.js

cd ../client
npm install
npm run dev
```

Backend defaults to `http://localhost:3002`; the Vite dev server usually runs on `http://localhost:5173`.

## Docs

- Project docs: `https://lessup.github.io/brave-sync-notes/`
- Site home covers positioning, reading paths, and deployment context
- See `CONTRIBUTING.md` for contribution guidelines

## License

MIT License
