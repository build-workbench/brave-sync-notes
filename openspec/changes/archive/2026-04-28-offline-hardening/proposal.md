# Proposal: Offline Mode Hardening

## Problem

The current offline support is basic:
- Notes are stored locally but sync is blocked when offline
- No service worker = no app access when offline
- No background sync = edits made offline won't sync until page is manually refreshed

Users expect:
- App works fully offline (can open, edit, search)
- Edits sync automatically when connection returns
- Works on slow/flaky networks (3G, WiFi dropouts)

## Solution

Implement **PWA + Background Sync**:

1. **Service Worker** - Cache app shell for offline access
2. **IndexedDB caching** - Cache sync updates for background replay
3. **Background Sync API** - Automatically retry failed updates when online
4. **Network monitoring** - Graceful degradation on slow networks

## Why Now

- Multi-notebook provides clear sync boundaries to cache
- Yjs provides incremental updates (small payloads, good for background sync)
- Search index is local (works fully offline)
- Foundation for PWA install

## Scope

- Register service worker on app startup
- Cache app shell and static assets
- Implement cache strategy (cache-first for assets, network-first for API)
- Queue failed updates in IndexedDB, retry on reconnect
- Show offline indicator and sync status

## Out of Scope

- PWA install prompt UI (implement next phase)
- Peer-to-peer sync (out of scope)
- Advanced cache versioning (defer to v2)
