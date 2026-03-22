---
title: Note Sync Now Overview
description: Repository overview and guided entry for running, understanding, and navigating the project.
permalink: /overview/
---

# Note Sync Now

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)

English | [简体中文](https://lessup.github.io/brave-sync-notes/zh/overview/) | [Docs](https://lessup.github.io/brave-sync-notes/)

Note Sync Now is an end-to-end encrypted note synchronization project for experimenting with mnemonic-based recovery, real-time collaboration, and privacy-first multi-device sync.

## Repository Overview

- React + Vite client in `brave-sync-notes/client`
- Express + Socket.IO server in `brave-sync-notes/server`
- AES-256-based client-side encryption with mnemonic recovery flow
- GitHub Pages site for architecture, usage paths, deployment notes, and project updates

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

- Project docs: <https://lessup.github.io/brave-sync-notes/>
- Architecture: <https://lessup.github.io/brave-sync-notes/architecture/>
- Deployment & operations: <https://lessup.github.io/brave-sync-notes/deployment/>
- Security & sync model: <https://lessup.github.io/brave-sync-notes/security-sync/>
- Changelog: <https://lessup.github.io/brave-sync-notes/changelog/>
- Contribution guide: <https://lessup.github.io/brave-sync-notes/contributing/>

## Suggested Reading Path

1. Start from the docs home for the navigation overview.
2. Use the architecture page to understand the client/server split and sync flow.
3. Use the deployment page before running or shipping changes.
4. Use the contribution guide before opening a pull request.

## License

MIT License
