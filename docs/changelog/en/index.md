---
layout: default
title: Changelog
description: Note Sync Now release history.
---

# Changelog

This page documents the changes in each Note Sync Now release.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


**Added**

- Shared utility functions for ID generation and content hashing
- `jsconfig.json` for LSP support in `apps/web/` and `apps/api/`
- `.github/copilot-instructions.md` for GitHub Copilot integration
- Local search functionality with SearchIndexProvider
- Multi-notebook support with notebook management utilities
- Offline queue management for enhanced offline support
- Version snapshots and history management
- Yjs-based real-time collaboration foundation


**Changed**

- Removed ~60+ verbose console.log statements across codebase
- Consolidated duplicate code into shared utilities
- **Security**: Increased PBKDF2 iterations from 10,000 to 100,000 (OWASP recommendation)
- Updated `.env.example` with new PBKDF2 default
- Updated repository description with bilingual format
- Optimized VitePress documentation portal


**Removed**

- `_bmad/` directory (BMad framework files, 140KB)
- `_bmad-output/` directory (planning artifacts)
- Duplicate `changelog/` directory (consolidated to `docs/changelog/`)
- Empty documentation directories (`docs/setup/`, `docs/tutorials/`, `docs/architecture/`)
- BMad skills from `.claude/skills/` (kept only OpenSpec skills)
- All dependabot and recovery remote branches (18 branches cleaned)
- `HANDOFF.md` (temporary handoff document)


**Fixed**

- Fixed SearchIndex import in SearchIndexProvider.jsx
- All lint warnings resolved
- All tests passing (195 frontend + 31 backend)


**Security**

- **BREAKING**: PBKDF2 iterations increased from 10,000 to 100,000
  - Existing sync chains must be re-created after upgrade
  - Users will need to re-enter their 12-word mnemonic

---

## 2.2.0 (2026-03-22)


**Added**

- **Documentation Site**: Complete navigation closure and deep pages
  - Added `changelog/index.md` as browsable archive
  - Added deep documentation pages: `architecture.md`, `deployment.md`, `security-sync.md`
  - Added front matter and permalinks to all documentation files

- **CI Pipeline**: Enhanced workflow gates
  - Split CI into `client` and `server` jobs
  - Integrated test execution for both client and server

- **Tests**: Sync link test coverage
  - Client: `useSocket.test.js` - connection, sync-update, request-sync, error handling
  - Server: `index.test.js` - health check, join-chain, push-update, request-sync


**Fixed**

- Server timer cleanup with `unref()` to prevent test process hanging
- `gracefulShutdown` and `startServer` no longer call `process.exit()` in test environment
- Extracted `handleSocketConnection` for direct socket event testing

---

## 2.1.0 (2026-03-13)


**Changed**

- **Documentation Architecture**: Restructured entry points
  - `README.md` / `README.zh-CN.md`: Repository entry only (positioning, quick start, links)
  - `index.md`: Documentation portal with reading paths
  - `CONTRIBUTING.md`: Integrated into docs site

- **Configuration Fixes**:
  - Fixed `_config.yml` repository from `LessUp/sync-notes` to `LessUp/brave-sync-notes`
  - Fixed `baseurl` from `/sync-notes` to `/brave-sync-notes`
  - Added `CONTRIBUTING.md` to Pages workflow paths

---

## 2.0.2 (2026-03-10)


**Added**

- **Workflow Standardization**:
  - Unified CI permissions: `contents: read`
  - Added concurrency configuration to prevent duplicate runs
  - Added `actions/configure-pages@v5` step
  - Added `paths` trigger filtering to reduce unnecessary builds


**Changed**

- **GitHub Pages Optimization**:
  - Added SEO metadata to `_config.yml`
  - Added `exclude` list to skip non-doc files from Jekyll build
  - Refined `paths` triggers for specific files
  - Fixed `sparse-checkout` configuration
  - Added deployment status badge to `index.md`

---

## 2.0.1 (2026-03-09) [SECURITY]


**Security**

- **[Critical] Server Input Validation**:
  - Added `encryptedData` validation: must be string, max 5MB
  - Added per-socket rate limiting: 30 updates/minute max
  - Added `timestamp` type validation

- **[Breaking] PBKDF2 Salt Improvement**:
  - Changed from hardcoded salt to mnemonic-derived salt: `SHA256("notesync-salt:" + mnemonic)`
  - Increased PBKDF2 iterations from 1,000 to 10,000
  - ⚠️ **Breaking**: Existing sync chains need to be re-created


**Fixed**

- **Memory Leak**: Room cleanup enhancement
  - Added `MAX_MEMORY_ROOMS` hard cap (default 10,000)
  - Two-phase cleanup: expired rooms first, then oldest when over capacity
  - Reduced cleanup interval from 60min to 30min

- **Socket Event Listener Leak**: Fixed race condition on rapid `joinChain` calls
  - Set `socketRef.current = null` before removing listeners
  - Cancel pending debounced pushes from previous session
  - Clear pending chunk reassembly state

---

## 2.0.0 (2025-11-25)


**Added**

- **Editor**: CodeMirror integration
  - Syntax highlighting for Markdown, JavaScript, Python, HTML, CSS, JSON
  - Auto-completion, bracket matching, code folding
  - Customizable font size, tab size, line numbers, word wrap
  - Dark/light theme auto-switching

- **Preview**: Enhanced Markdown rendering
  - Code block highlighting with Prism
  - GFM support: tables, task lists, strikethrough
  - Split view mode: edit/preview/side-by-side

- **History**: Version management
  - Auto-save on each sync
  - One-click restore to any version
  - Single delete or clear all
  - LocalStorage persistence

- **Mobile**: QR code join
  - Auto-generate sync chain QR code
  - Mobile scan to join instantly
  - URL parameter auto-fill support

- **Import/Export**: File operations
  - Import .txt, .md, .markdown files
  - Export as Markdown or plain text


**Changed**

- **Performance**:
  - Chunked transfer for content > 50KB
  - Debounced sync (configurable, default 300ms)
  - Zustand state management
  - Component lazy loading
  - Memoization with useMemo

- **UI/UX**:
  - Glassmorphism design with Framer Motion animations
  - Fully responsive, mobile-first layout
  - System dark mode preference support
  - Bilingual UI (EN/ZH-CN)

- **Server**:
  - Connection pool: WebSocket + Polling dual channels
  - Auto cleanup of expired rooms
  - Health check: `GET /health`, `GET /stats`
  - Graceful shutdown: SIGTERM/SIGINT
  - Config: maxHttpBufferSize 10MB, pingTimeout 60s

---

## 1.2.0 (2025-12-19)


**Added**

- **Conflict Management**: Client-side conflict detection and resolution
  - Added `noteVersion`, `noteTimestamp`, `noteDeviceId` to store state
  - Integrated `ConflictManager` in `sync-update` flow
  - `ConflictIndicator` and `ConflictDialog` UI components
  - Manual resolution: keep local/remote or custom merge


**Changed**

- `setNote(note, meta?)` supports remote metadata
- `restoreFromHistory` maintains version metadata
- Exposed `conflictCount`, `pendingConflicts`, `resolveConflict`, `clearConflicts` from hook

---

## 1.1.0 (2025-12-18)


**Fixed**

- **[Critical] Async Handler**: Fixed `join-chain` callback not declared as `async`
- **Configuration**:
  - Added `require('dotenv').config()` on server startup
  - Unified room ID validation with `DataValidator.isValidRoomId()`
  - Made CORS Origin configurable via `CORS_ORIGIN` env var
  - Made room TTL configurable via `ROOM_TTL_MS` env var

---

## 1.0.1 (2025-11-24)


**Added**

- **Deployment**: Preparation for production
  - Added `.gitignore` for client (node_modules, build artifacts, env files)
  - Planned Netlify CLI deployment for Vite + React frontend

---

## 1.0.0 (2025-02-13)


**Added**

- **Project Infrastructure**:
  - Added `.editorconfig` for consistent code formatting
  - Added standard badges to README (License, React, Express, Socket.IO, Vite)

---

[Unreleased]: https://github.com/LessUp/brave-sync-notes/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/LessUp/brave-sync-notes/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/LessUp/brave-sync-notes/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/LessUp/brave-sync-notes/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/LessUp/brave-sync-notes/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/LessUp/brave-sync-notes/releases/tag/v1.0.0
