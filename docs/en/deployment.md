---
layout: default
title: Deployment Guide
description: Local development, server persistence, Pages deployment, and workflow configuration for Note Sync Now
permalink: /docs/en/deployment/
lang: en
---

# Deployment Guide

This guide covers how to run Note Sync Now locally, in production, and key configuration boundaries when adjusting deployment and workflows.

---

## Local Development

### Server Setup

```bash
cd apps/api
npm ci
node index.js
```

Default port: `3002`

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3002` |
| `CORS_ORIGIN` | CORS origin (dev: `http://localhost:5173`) | Required in production |
| `PRIMARY_STORAGE` | Main storage backend (`redis`, `sqlite`, `memory`) | `memory` |
| `FALLBACK_STORAGE` | Fallback storage backend | `memory` |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis authentication password | - |
| `REDIS_DB` | Redis database number | `0` |
| `SQLITE_DB_PATH` | SQLite database file path | `./data/sync.db` |
| `ROOM_TTL_MS` | Room time-to-live in milliseconds | `3600000` (1 hour) |
| `MAX_MEMORY_ROOMS` | Maximum number of rooms in memory | `10000` |

Key entry points:
- `apps/api/index.js`
- `apps/api/start-local.sh`
- `apps/api/.env.example`

The `start-local.sh` script requires dependencies to be pre-installed and starts with `NODE_ENV=development` by default. If `CORS_ORIGIN` is not explicitly set, it uses `http://localhost:5173` as the local development default. To avoid blocking on Redis connection, it defaults both `PRIMARY_STORAGE` and `FALLBACK_STORAGE` to `sqlite`.

### Client Setup

```bash
cd apps/web
npm ci
npm run dev
```

Default development address: `http://localhost:5173`

#### Client Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:3002` (dev only) |

Key files:
- `apps/web/vite.config.js`
- `apps/web/package.json`

In local development, if `VITE_SOCKET_URL` is not set, the client falls back to `http://localhost:3002`. In non-development environments, this variable must be explicitly provided to avoid silently connecting to the wrong address.

---

## Server Runtime Model

The server initializes the persistence layer on startup:

1. Attempt to initialize `PersistenceManager`
2. Select Redis as primary storage and SQLite as fallback based on configuration
3. If persistence initialization fails, fall back to pure memory mode
4. Expose `/health` and `/stats` endpoints for runtime status checks

This means:

- Development environments can verify the sync main link without full persistence dependencies
- Production environments should prioritize ensuring both primary and fallback storage are available
- When falling back to memory mode, sync state cannot be preserved after restart

### Persistence Layer Hierarchy

```
PersistenceManager
├── Primary Storage
│   ├── Redis (recommended for production)
│   ├── SQLite (lightweight alternative)
│   └── Memory (development only)
└── Fallback Storage
    ├── SQLite (if primary is Redis)
    └── Memory (last resort)
```

---

## Production Deployment

### Docker Deployment (Recommended)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  server:
    build: ./apps/api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3002
      - CORS_ORIGIN=https://your-domain.com
      - PRIMARY_STORAGE=redis
      - FALLBACK_STORAGE=sqlite
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ROOM_TTL_MS=3600000
    ports:
      - "3002:3002"
    depends_on:
      - redis

volumes:
  redis-data:
```

### Environment-Specific Considerations

#### Production Checklist

- [ ] Set explicit `CORS_ORIGIN` (do not use wildcard)
- [ ] Configure primary storage (Redis recommended)
- [ ] Configure fallback storage (SQLite)
- [ ] Set up SSL/TLS termination
- [ ] Configure firewall rules
- [ ] Set up log aggregation
- [ ] Configure monitoring (health checks)
- [ ] Set resource limits (CPU, memory)

#### Health Check Endpoints

| Endpoint | Purpose | Example Response |
|----------|---------|------------------|
| `GET /health` | Basic health status | `{"status":"healthy","connections":5,"rooms":3,"persistence":"connected"}` |
| `GET /stats` | Detailed statistics | Connection count, room count, memory usage, persistence stats |

---

## GitHub Pages Documentation Site

The repository root hosts the GitHub Pages documentation site. Key files:

- `index.md`
- `README.md`
- `README.zh-CN.md`
- `CONTRIBUTING.md`
- `docs/` (this directory)
- `_config.yml`
- `.github/workflows/pages.yml`

Pages serves as:

- Project introduction
- Architecture and sync mechanism documentation
- Deployment and operations guides
- Changelog archive

### Building Docs Locally

```bash
# Install Jekyll (requires Ruby)
gem install bundler jekyll

# Serve locally
bundle exec jekyll serve
```

---

## CI/CD and Release Verification

### Local Verification Commands

```bash
# Client tests and build
cd apps/web && npm ci && npm test -- --run && npm run build

# Server tests
cd ../api && npm ci && npm test

# Property-based tests (recommended for sync/persistence changes)
cd ../api && npm run test:property
```

### CI/CD Pipeline

The project uses GitHub Actions with two workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on PR and push to main
   - Executes client tests and build
   - Executes server tests

2. **Pages Workflow** (`.github/workflows/pages.yml`)
   - Builds and deploys documentation
   - Triggers on docs changes

---

## Modifying Deployment / Workflow Checkpoints

### When Modifying Server

Verify:

- Health check `/health` remains functional
- `join-chain` / `push-update` / `request-sync` maintain compatibility
- Persistence failure correctly falls back to memory mode

### When Modifying Client Sync Logic

Verify:

- Local development allows `VITE_SOCKET_URL` to fall back to `http://localhost:3002`
- Production environment gives clear error if `VITE_SOCKET_URL` is missing
- Reconnection properly rejoins room after disconnect
- Error events and status indicators remain functional

### When Modifying Pages / CI Workflows

Verify:

- Pages covers all public documentation pages
- CI at minimum runs client tests, client build, server tests, and server property tests
- Documentation structure changes are reflected in `changelog/`

---

## Troubleshooting

### Connection Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Client cannot connect | CORS misconfiguration | Check `CORS_ORIGIN` matches client URL |
| Server not starting | Port already in use | Change `PORT` or kill existing process |
| Redis connection fails | Redis not running | Start Redis or use SQLite fallback |

### Sync Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Updates not received | Room mismatch | Verify same mnemonic on all clients |
| Large content fails | Size limit exceeded | Content is chunked automatically; check server limits |
| Rate limit errors | Too frequent updates | Reduce edit frequency or adjust rate limits |

---

## Recommended Reading Order

1. [Documentation Home](../)
2. [Quick Start Guide](./getting-started)
3. [Architecture Overview](./architecture)
4. Current page: Deployment Guide
5. [Security & Synchronization](./security-sync)
6. [Contributing Guide](./contributing)

---

*Last updated: 2026-04-16*
