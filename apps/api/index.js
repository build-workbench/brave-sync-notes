require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const PersistenceManager = require('./src/persistence/PersistenceManager');
const { DataValidator } = require('./src/persistence/PersistenceAdapter');
const { logger } = require('./src/utils/logger');

const NODE_ENV = process.env.NODE_ENV || 'development';
const DEFAULT_DEV_ORIGIN = 'http://localhost:5173';

function resolveCorsOrigin() {
  if (process.env.CORS_ORIGIN) {
    // 生产环境拒绝通配符:允许任意站点连入会破坏房间成员边界
    if (process.env.CORS_ORIGIN === '*' && NODE_ENV === 'production') {
      throw new Error('CORS_ORIGIN must be a concrete origin in production (wildcard "*" is not allowed)');
    }
    return process.env.CORS_ORIGIN;
  }

  if (NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  logger.warn(`CORS_ORIGIN not set, defaulting to ${DEFAULT_DEV_ORIGIN} for ${NODE_ENV}`);
  return DEFAULT_DEV_ORIGIN;
}

// 结构化错误:客户端可依据 type/code/recoverable 区分可重试与永久失败
function buildError(type, message, code, recoverable) {
  return { type, message, code, recoverable: !!recoverable };
}

const corsOrigin = resolveCorsOrigin();

const app = express();
app.use(cors({ origin: corsOrigin }));
// 服务只提供 GET 端点与 Socket.IO 通道,无需 body 解析
// (Socket.IO 载荷上限由 maxHttpBufferSize 单独控制)

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    rooms: chainStore.size,
    persistence: {
      enabled: !!persistenceManager,
      healthy: false,
      adapter: null
    }
  };

  if (persistenceManager) {
    try {
      health.persistence.healthy = await persistenceManager.isHealthy();
      health.persistence.adapter = persistenceManager.getCurrentAdapter();
    } catch (error) {
      // 脱敏:不向任意访问者暴露底层错误细节(主机/端口/路径等)
      logger.error('Health check persistence error:', { error: error.message });
      health.persistence.error = 'persistence check failed';
    }
  }

  res.json(health);
});

// Stats endpoint — 仅暴露运行概况,不泄露基础设施细节(host/port/db 等)
app.get('/stats', async (req, res) => {
  const stats = {
    activeConnections: io.engine.clientsCount,
    activeRooms: chainStore.size,
    uptimeSeconds: Math.round(process.uptime()),
    persistence: null
  };

  if (persistenceManager) {
    try {
      const fullStats = await persistenceManager.getStats();
      stats.persistence = {
        currentAdapter: fullStats.current?.adapter || null,
        connected: fullStats.current?.connected ?? null,
        roomCount: fullStats.current?.roomCount ?? null,
        totalKeys: fullStats.current?.totalKeys ?? null,
      };
    } catch (error) {
      stats.persistence = { error: 'stats unavailable' };
    }
  }

  res.json(stats);
});

// 单条密文推送上限(5MB),Socket.IO 缓冲与事件校验共用
const MAX_DATA_SIZE_BYTES = 5 * 1024 * 1024;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  },
  // 与 push-update 的 MAX_DATA_SIZE_BYTES 对齐,留出信封余量
  maxHttpBufferSize: Math.ceil(MAX_DATA_SIZE_BYTES * 1.1),
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// 持久化存储管理器
let persistenceManager;

// 初始化持久化存储
async function initializePersistence() {
  persistenceManager = new PersistenceManager({
    primaryAdapter: process.env.PRIMARY_STORAGE || 'redis',
    fallbackAdapter: process.env.FALLBACK_STORAGE || 'sqlite',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    },
    sqlite: {
      dbPath: process.env.SQLITE_DB_PATH || './data/notesync.db'
    }
  });

  try {
    await persistenceManager.initialize();
    logger.info('Persistence layer initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize persistence layer:', { error: error.message });
    // 如果持久化初始化失败，回退到内存存储
    logger.warn('Falling back to in-memory storage');
    persistenceManager = null;
  }
}

// 内存存储作为最后的备用方案
// Key: RoomID (Public Hash), Value: { encryptedData, timestamp, deviceName }
const chainStore = new Map();

// Track socket metadata: socketId -> { roomId, deviceName, joinedAt }
const socketMeta = new Map();

const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS) || 24 * 60 * 60 * 1000;

// Cleanup stale rooms — runs every 30 minutes
// Removes rooms with no connected clients that are older than TTL.
// Also enforces a hard cap on total in-memory rooms to prevent unbounded growth.
const MAX_MEMORY_ROOMS = Number(process.env.MAX_MEMORY_ROOMS) || 10000;

const roomCleanupTimer = setInterval(async () => {
  const now = Date.now();
  let evictedTTL = 0;
  let evictedCap = 0;

  // Phase 1: evict expired rooms with no clients
  for (const [roomId, data] of chainStore.entries()) {
    if (now - data.timestamp > ROOM_TTL_MS) {
      const clients = io.sockets.adapter.rooms.get(roomId);
      if (!clients || clients.size === 0) {
        chainStore.delete(roomId);
        evictedTTL++;
      }
    }
  }

  // Phase 2: if still over capacity, evict oldest rooms without clients
  if (chainStore.size > MAX_MEMORY_ROOMS) {
    const sorted = [...chainStore.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (const [roomId] of sorted) {
      if (chainStore.size <= MAX_MEMORY_ROOMS) break;
      const clients = io.sockets.adapter.rooms.get(roomId);
      if (!clients || clients.size === 0) {
        chainStore.delete(roomId);
        evictedCap++;
      }
    }
  }

  if (evictedTTL + evictedCap > 0) {
    logger.info(`Room cleanup: ${evictedTTL} expired, ${evictedCap} over-cap. Remaining: ${chainStore.size}`);
  }

  // 持久层过期清理:Redis 靠自身 TTL 兜底,SQLite 没有任何清理机制,
  // 必须周期性调用 cleanupExpired,否则磁盘无限膨胀。
  if (persistenceManager) {
    try {
      const deleted = await persistenceManager.cleanupExpired(new Date(now - ROOM_TTL_MS));
      if (deleted > 0) {
        logger.info(`Persistence cleanup: removed ${deleted} expired rooms`);
      }
    } catch (error) {
      logger.error('Persistence cleanup failed:', { error: error.message });
    }
  }
}, 30 * 60 * 1000);
roomCleanupTimer.unref?.();

// 每连接每分钟事件预算(按事件分桶计数)
const RATE_LIMITS = {
  'push-update': 30,
  'join-chain': 10,
  'request-sync': 60,
  'ping-latency': 120,
};
const RATE_WINDOW_MS = 60000;

// 固定窗口限流:超预算返回 false。计数挂在 socketMeta 上,断开即释放。
function consumeRateBudget(meta, event) {
  const now = Date.now();
  if (!meta._rate || now - meta._rate.startedAt > RATE_WINDOW_MS) {
    meta._rate = { startedAt: now, counts: {} };
  }
  const limit = RATE_LIMITS[event];
  if (!limit) return true;
  meta._rate.counts[event] = (meta._rate.counts[event] || 0) + 1;
  return meta._rate.counts[event] <= limit;
}

function handleSocketConnection(socket) {
  logger.info(`User connected: ${socket.id}`);

  // 发送结构化错误(带 ack 回调时同步回执,便于客户端区分失败类型)
  const sendError = (message, code, recoverable = false) => {
    socket.emit('error', buildError('ERROR', message, code, recoverable));
  };

  // Join a specific sync chain
  socket.on('join-chain', async (payload = {}) => {
    const { roomId, deviceName } = payload;
    try {
      // Validate input
      if (!DataValidator.isValidRoomId(roomId)) {
        sendError('Invalid room ID', 'INVALID_ROOM_ID');
        return;
      }

      // 限流:首次 join 也计入预算(meta 尚未初始化时先建桶,防止换连接绕过)
      let meta = socketMeta.get(socket.id);
      if (!meta) {
        meta = { _rate: null };
        socketMeta.set(socket.id, meta);
      }
      if (!consumeRateBudget(meta, 'join-chain')) {
        sendError('Rate limit exceeded', 'RATE_LIMIT', true);
        return;
      }

      // Sanitize device name - remove dangerous characters
      const sanitizedDeviceName = (typeof deviceName === 'string' && deviceName.trim())
        ? deviceName.trim()
            .substring(0, 50)
            .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
        : 'Unknown Device';

      // Leave previous room if any
      if (socketMeta.has(socket.id)) {
        const oldRoom = socketMeta.get(socket.id).roomId;
        socket.leave(oldRoom);
        updateRoomMembers(oldRoom);
      }

      socket.join(roomId);
      // Store metadata for this socket
      socketMeta.set(socket.id, {
        roomId,
        deviceName: sanitizedDeviceName,
        joinedAt: Date.now(),
        _rate: meta._rate,
      });

      logger.room('join', roomId, { socketId: socket.id, deviceName: sanitizedDeviceName });

      // 1. Send existing data to the new device
      let existingData = null;

      // 尝试从持久化存储获取数据
      if (persistenceManager) {
        try {
          existingData = await persistenceManager.getRoom(roomId);
        } catch (error) {
          logger.error('Failed to get room from persistence:', { error: error.message });
        }
      }

      // 如果持久化存储没有数据，尝试内存存储
      if (!existingData && chainStore.has(roomId)) {
        existingData = chainStore.get(roomId);
      }

      if (existingData) {
        socket.emit('sync-update', existingData);
      }

      // 2. Broadcast updated member list to everyone in the room
      updateRoomMembers(roomId);

      // 3. 确认加入成功:客户端收到 join-ack 后才处理离线队列,
      //    避免 push-update 因尚未成为成员而被拒绝
      socket.emit('join-ack', { roomId, success: true });
    } catch (error) {
      logger.error('Error in join-chain:', { error: error.message });
      sendError('Failed to join chain', 'JOIN_FAILED', true);
    }
  });

  // Receive an update from a client (supports both legacy and v2 envelope)
  socket.on('push-update', async (incoming = {}, ack) => {
    const fail = (message, code, recoverable = false) => {
      if (typeof ack === 'function') {
        ack({ success: false, code });
      }
      sendError(message, code, recoverable);
    };

    try {
      const { roomId, encryptedData, timestamp, v, deviceId, seq } = incoming;
      // Validate room membership
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.roomId !== roomId) {
        fail('Not a member of this room', 'NOT_MEMBER', true);
        return;
      }

      // 校验密文结构:合法 base64 且至少含 12 字节 IV + 16 字节 tag + 1 字节密文。
      // 仅校验格式与长度,不解析内容(保持零知识)。
      if (!encryptedData || typeof encryptedData !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(encryptedData) || encryptedData.length < 40) {
        fail('Invalid data format', 'INVALID_DATA');
        return;
      }
      // Use Buffer.byteLength for accurate byte count (handles Unicode correctly)
      const dataByteSize = Buffer.byteLength(encryptedData, 'utf8');
      if (dataByteSize > MAX_DATA_SIZE_BYTES) {
        fail(`Data too large (max ${MAX_DATA_SIZE_BYTES / 1024 / 1024}MB)`, 'DATA_TOO_LARGE');
        return;
      }

      // v2 信封校验:deviceId/seq 必须合法;显式其他版本一律拒绝
      if (v === 2) {
        if (
          typeof deviceId !== 'string' ||
          !/^[a-zA-Z0-9_-]{8,64}$/.test(deviceId) ||
          !Number.isInteger(seq) ||
          seq < 0
        ) {
          fail('Invalid envelope', 'INVALID_ENVELOPE');
          return;
        }
      } else if (v !== undefined) {
        fail('Unsupported protocol version', 'UNSUPPORTED_PROTOCOL');
        return;
      }

      // Rate limiting: max 30 updates per minute per socket
      if (!consumeRateBudget(meta, 'push-update')) {
        fail('Rate limit exceeded', 'RATE_LIMIT', true);
        return;
      }

      const payload = {
        encryptedData,
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        deviceName: meta.deviceName,
        version: Date.now(),
      };
      // v2 信封透传：若客户端发送则一并持久化并广播，保持与存量 legacy 的兼容
      if (v !== undefined) payload.v = v;
      if (typeof deviceId === 'string') payload.deviceId = deviceId;
      if (Number.isInteger(seq)) payload.seq = seq;

      // 保存到内存存储
      chainStore.set(roomId, payload);

      // 尝试保存到持久化存储
      if (persistenceManager) {
        try {
          await persistenceManager.saveRoom(roomId, payload);
        } catch (error) {
          logger.error('Failed to save room to persistence:', { error: error.message });
          // 持久化失败不影响实时同步
        }
      }

      // Broadcast to everyone else in the chain
      socket.to(roomId).emit('sync-update', payload);

      // Acknowledge receipt:优先 ack 回调(客户端等待确认后才认为已同步)
      if (typeof ack === 'function') {
        ack({ success: true, timestamp });
      }
      socket.emit('update-ack', { timestamp, success: true });
    } catch (error) {
      logger.error('Error in push-update:', { error: error.message });
      fail('Failed to push update', 'PUSH_FAILED', true);
    }
  });

  // Request sync (for reconnection scenarios)
  socket.on('request-sync', async ({ roomId }) => {
    try {
      // 与 push-update 一致的成员校验:防止任意连接枚举/拉取任意房间密文
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.roomId !== roomId) {
        sendError('Not a member of this room', 'NOT_MEMBER', true);
        return;
      }

      if (!consumeRateBudget(meta, 'request-sync')) {
        sendError('Rate limit exceeded', 'RATE_LIMIT', true);
        return;
      }

      let existingData = null;

      // 尝试从持久化存储获取数据
      if (persistenceManager) {
        try {
          existingData = await persistenceManager.getRoom(roomId);
        } catch (error) {
          logger.error('Failed to get room from persistence:', { error: error.message });
        }
      }

      // 如果持久化存储没有数据，尝试内存存储
      if (!existingData && chainStore.has(roomId)) {
        existingData = chainStore.get(roomId);
      }

      if (existingData) {
        socket.emit('sync-update', existingData);
      }
    } catch (error) {
      logger.error('Error in request-sync:', { error: error.message });
      sendError('Failed to request sync', 'SYNC_FAILED', true);
    }
  });

  // Ping for latency measurement
  socket.on('ping-latency', (callback) => {
    const meta = socketMeta.get(socket.id);
    if (meta && !consumeRateBudget(meta, 'ping-latency')) {
      return;
    }
    if (typeof callback === 'function') {
      callback({ timestamp: Date.now() });
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info(`User disconnected: ${socket.id}`, { reason });
    if (socketMeta.has(socket.id)) {
      const { roomId } = socketMeta.get(socket.id);
      socketMeta.delete(socket.id);
      // Notify others that this device left
      updateRoomMembers(roomId);
    }
  });

  // 防御性日志:error.message 可能来自客户端伪造,非 Error 实例只记录类型
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, {
      error: error instanceof Error ? error.message : typeof error,
    });
  });
}

io.on('connection', handleSocketConnection);

function updateRoomMembers(roomId) {
  // Get all socket IDs in the room
  const clients = io.sockets.adapter.rooms.get(roomId);
  if (!clients) return;

  const members = [];
  for (const clientId of clients) {
    const meta = socketMeta.get(clientId);
    if (meta) {
      members.push({
        id: clientId,
        name: meta.deviceName,
        status: 'online',
        joinedAt: meta.joinedAt
      });
    }
  }

  // Sort by join time
  members.sort((a, b) => a.joinedAt - b.joinedAt);

  io.to(roomId).emit('room-info', {
    members,
    roomSize: members.length,
    timestamp: Date.now()
  });
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.warn(`${signal} received, shutting down gracefully...`);

  try {
    // 先断开所有 Socket.IO 长连接,再关闭 HTTP server,
    // 否则已建立的 WebSocket 会让 server.close 挂起等待
    io.close();
    logger.info('Socket.IO connections closed');

    if (server.listening) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      logger.info('HTTP server closed');
    }

    // 关闭持久化存储
    if (persistenceManager) {
      await persistenceManager.close();
      logger.info('Persistence layer closed');
      persistenceManager = null;
    }

    logger.info('Graceful shutdown completed');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during shutdown:', { error: error.message });
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

let shutdownHandlersRegistered = false;

function registerShutdownHandlers() {
  if (shutdownHandlersRegistered) {
    return;
  }

  const handleSignal = (signal) => {
    gracefulShutdown(signal).catch((error) => {
      logger.error(`Failed to shut down after ${signal}:`, { error: error.message });
    });
  };

  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  process.on('SIGINT', () => handleSignal('SIGINT'));
  shutdownHandlersRegistered = true;
}


async function startServer() {
  try {
    // 初始化持久化存储
    await initializePersistence();

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, '0.0.0.0', () => {
        server.off('error', reject);
        logger.info(`Secure Note Sync Server running on port ${PORT}`);
        logger.info(`Health check: http://localhost:${PORT}/health | Stats: http://localhost:${PORT}/stats`);

        if (persistenceManager) {
          logger.info(`Persistence: ${persistenceManager.getCurrentAdapter()}`);
        } else {
          logger.warn('Persistence: In-memory only');
        }

        resolve();
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

const PORT = process.env.PORT || 3002;

module.exports = {
  app,
  server,
  io,
  startServer,
  registerShutdownHandlers,
  initializePersistence,
  updateRoomMembers,
  gracefulShutdown,
  handleSocketConnection,
  stores: {
    chainStore,
    socketMeta,
  },
};

if (require.main === module) {
  // 兜底:未捕获异常/拒绝不应让进程无声挂掉或带着未知状态继续跑
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception, shutting down:', error);
    gracefulShutdown('uncaughtException').catch(() => process.exit(1));
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection, shutting down:', reason);
    gracefulShutdown('unhandledRejection').catch(() => process.exit(1));
  });

  registerShutdownHandlers();
  startServer();
}
