---
layout: default
title: REST API Reference
description: HTTP endpoints for health checks, statistics, and server management
permalink: /docs/api/rest-api/
---

# REST API Reference

This document describes the HTTP REST endpoints provided by the Note Sync Now server.

**Base URL**: `http://localhost:3002` (default)

---

## Health & Status

### GET /health

Basic health check endpoint for monitoring and load balancers.

**URL**: `/health`

**Method**: `GET`

**Auth required**: No

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T10:30:00.000Z",
  "uptime": 3600,
  "connections": {
    "active": 5,
    "total": 23
  },
  "rooms": {
    "active": 3,
    "total": 12
  },
  "persistence": {
    "primary": {
      "type": "redis",
      "status": "connected"
    },
    "fallback": {
      "type": "sqlite",
      "status": "connected"
    }
  }
}
```

**Error Response** (503 Service Unavailable):

```json
{
  "status": "unhealthy",
  "timestamp": "2026-04-16T10:30:00.000Z",
  "error": "Persistence layer disconnected",
  "persistence": {
    "primary": {
      "type": "redis",
      "status": "disconnected"
    },
    "fallback": {
      "type": "sqlite",
      "status": "connected"
    }
  }
}
```

**Status Values**:

| Status | Description |
|--------|-------------|
| `healthy` | All systems operational |
| `degraded` | Fallback storage active |
| `unhealthy` | Critical issues detected |

---

### GET /stats

Detailed server statistics.

**URL**: `/stats`

**Method**: `GET`

**Auth required**: No

**Success Response** (200 OK):

```json
{
  "server": {
    "version": "2.2.0",
    "nodeVersion": "v20.11.0",
    "uptime": 3600,
    "platform": "linux",
    "arch": "x64"
  },
  "connections": {
    "active": 5,
    "peak": 15,
    "total": 23
  },
  "rooms": {
    "active": 3,
    "peak": 8,
    "total": 12,
    "byStorage": {
      "redis": 2,
      "sqlite": 1
    }
  },
  "memory": {
    "used": {
      "value": 45.2,
      "unit": "MB"
    },
    "total": {
      "value": 512,
      "unit": "MB"
    },
    "percentage": 8.8
  },
  "persistence": {
    "primary": {
      "type": "redis",
      "status": "connected",
      "latency": 2,
      "latencyUnit": "ms",
      "operations": {
        "read": 156,
        "write": 89
      }
    },
    "fallback": {
      "type": "sqlite",
      "status": "connected",
      "records": 128,
      "fileSize": {
        "value": 256,
        "unit": "KB"
      }
    }
  }
}
```

---

### GET /ready

Readiness probe for Kubernetes and similar orchestrators.

**URL**: `/ready`

**Method**: `GET`

**Auth required**: No

**Success Response** (200 OK):

```json
{
  "ready": true,
  "checks": {
    "persistence": "ok",
    "memory": "ok"
  }
}
```

**Not Ready Response** (503 Service Unavailable):

```json
{
  "ready": false,
  "checks": {
    "persistence": "failing",
    "memory": "ok"
  }
}
```

---

### GET /live

Liveness probe for Kubernetes and similar orchestrators.

**URL**: `/live`

**Method**: `GET`

**Auth required**: No

**Success Response** (200 OK):

```json
{
  "alive": true
}
```

---

## Server Management

### POST /admin/rooms/cleanup

Trigger manual room cleanup (requires authentication in production).

**URL**: `/admin/rooms/cleanup`

**Method**: `POST`

**Auth required**: Yes (API Key)

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "cleaned": 5,
  "remaining": 7,
  "timestamp": "2026-04-16T10:30:00.000Z"
}
```

**Error Response** (401 Unauthorized):

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

---

### GET /admin/rooms

List active rooms (requires authentication).

**URL**: `/admin/rooms`

**Method**: `GET`

**Auth required**: Yes (API Key)

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Maximum rooms to return (default: 100) |
| `offset` | number | Pagination offset |
| `storage` | string | Filter by storage type (`redis`, `sqlite`, `memory`) |

**Success Response** (200 OK):

```json
{
  "rooms": [
    {
      "id": "abc123def456",
      "members": 2,
      "createdAt": "2026-04-16T09:00:00.000Z",
      "lastActivity": "2026-04-16T10:25:00.000Z",
      "storage": "redis",
      "hasData": true
    }
  ],
  "total": 3,
  "limit": 100,
  "offset": 0
}
```

---

## API Usage Examples

### cURL Examples

```bash
# Health check
curl http://localhost:3002/health

# Get stats
curl http://localhost:3002/stats

# Readiness probe
curl http://localhost:3002/ready

# Liveness probe  
curl http://localhost:3002/live

# List rooms (with auth)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3002/admin/rooms?limit=10

# Trigger cleanup (with auth)
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3002/admin/rooms/cleanup
```

### JavaScript/Fetch Examples

```javascript
// Health check
async function checkHealth() {
  const response = await fetch('http://localhost:3002/health');
  const data = await response.json();
  
  if (data.status === 'healthy') {
    console.log('Server is healthy');
    console.log(`Active connections: ${data.connections.active}`);
  } else {
    console.warn('Server is unhealthy:', data.error);
  }
}

// Get stats
async function getStats() {
  const response = await fetch('http://localhost:3002/stats');
  const stats = await response.json();
  
  console.log('Server version:', stats.server.version);
  console.log('Active connections:', stats.connections.active);
  console.log('Memory usage:', stats.memory.percentage + '%');
}

// Check readiness (for Kubernetes)
async function checkReadiness() {
  try {
    const response = await fetch('http://localhost:3002/ready');
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Endpoint not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Server unhealthy |

---

## Rate Limiting

REST API endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/health` | 60 | 1 minute |
| `/stats` | 30 | 1 minute |
| `/admin/*` | 10 | 1 minute |

When rate limited, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30,
  "limit": 60,
  "window": "1m"
}
```

With HTTP status: **429 Too Many Requests**

---

## Monitoring Integration

### Prometheus Format (Planned)

```
# HELP sync_notes_connections_active Current active WebSocket connections
# TYPE sync_notes_connections_active gauge
sync_notes_connections_active 5

# HELP sync_notes_rooms_active Current active rooms
# TYPE sync_notes_rooms_active gauge
sync_notes_rooms_active 3

# HELP sync_notes_persistence_operations_total Total persistence operations
# TYPE sync_notes_persistence_operations_total counter
sync_notes_persistence_operations_total{operation="read",storage="redis"} 156
sync_notes_persistence_operations_total{operation="write",storage="redis"} 89
```

### Datadog/New Relic

Use the `/health` and `/stats` endpoints for health checks and APM integration.

---

## See Also

- [WebSocket API Reference](./websocket-api.md)
- [Architecture Overview](../en/architecture.md)
- [Deployment Guide](../en/deployment.md)

---

*Last updated: 2026-04-16*
