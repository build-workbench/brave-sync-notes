require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const PersistenceManager = require('./src/persistence/PersistenceManager');
const { DataValidator } = require('./src/persistence/PersistenceAdapter');

const NODE_ENV = process.env.NODE_ENV || 'development';
const DEFAULT_DEV_ORIGIN = 'http://localhost:5173';

function resolveCorsOrigin() {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }

  if (NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  console.warn(`CORS_ORIGIN not set, defaulting to ${DEFAULT_DEV_ORIGIN} for ${NODE_ENV}`);
  return DEFAULT_DEV_ORIGIN;
}

const corsOrigin = resolveCorsOrigin();

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '50mb' }));

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
      health.persistence.error = error.message;
    }
  }

  res.json(health);
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  const stats = {
    activeConnections: io.engine.clientsCount,
    activeRooms: chainStore.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    persistence: null
  };

  if (persistenceManager) {
    try {
      stats.persistence = await persistenceManager.getStats();
    } catch (error) {
      stats.persistence = { error: error.message };
    }
  }

  res.json(stats);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  },
  // Increase max buffer size for large files
  maxHttpBufferSize: 10e6, // 10MB
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
    console.log('✅ Persistence layer initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize persistence layer:', error);
    // 如果持久化初始化失败，回退到内存存储
    console.log('🔄 Falling back to in-memory storage');
    persistenceManager = null;
  }
}

// 内存存储作为最后的备用方案
// Key: RoomID (Public Hash), Value: { encryptedData, timestamp, deviceName }
const chainStore = new Map();

// Track socket metadata: socketId -> { roomId, deviceName, joinedAt }
const socketMeta = new Map();

// Chunked transfer storage: sessionId -> { chunks: [], total, received }
const chunkStore = new Map();

const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS) || 24 * 60 * 60 * 1000;

// Cleanup old chunk sessions (older than 5 minutes)
const chunkCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of chunkStore.entries()) {
    if (now - session.startTime > 5 * 60 * 1000) {
      chunkStore.delete(sessionId);
      console.log(`Cleaned up stale chunk session: ${sessionId}`);
    }
  }
}, 60000);
chunkCleanupTimer.unref?.();

// Cleanup stale rooms — runs every 30 minutes
// Removes rooms with no connected clients that are older than TTL.
// Also enforces a hard cap on total in-memory rooms to prevent unbounded growth.
const MAX_MEMORY_ROOMS = Number(process.env.MAX_MEMORY_ROOMS) || 10000;

const roomCleanupTimer = setInterval(() => {
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
    console.log(`Room cleanup: ${evictedTTL} expired, ${evictedCap} over-cap. Remaining: ${chainStore.size}`);
  }
}, 30 * 60 * 1000);
roomCleanupTimer.unref?.();

function handleSocketConnection(socket) {
  console.log(`[${new Date().toISOString()}] User connected: ${socket.id}`);

  // Join a specific sync chain
  socket.on('join-chain', async (payload = {}) => {
    const { roomId, deviceName } = payload;
    try {
      // Validate input
      if (!DataValidator.isValidRoomId(roomId)) {
        socket.emit('error', { message: 'Invalid room ID' });
        return;
      }

      const safeDeviceName = (typeof deviceName === 'string' && deviceName.trim())
        ? deviceName.trim().substring(0, 50)
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
        deviceName: safeDeviceName,
        joinedAt: Date.now()
      });

      console.log(`[${new Date().toISOString()}] Socket ${socket.id} (${safeDeviceName}) joined chain: ${roomId.substring(0, 8)}...`);

      // 1. Send existing data to the new device
      let existingData = null;

      // 尝试从持久化存储获取数据
      if (persistenceManager) {
        try {
          existingData = await persistenceManager.getRoom(roomId);
        } catch (error) {
          console.error('Failed to get room from persistence:', error);
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
    } catch (error) {
      console.error('Error in join-chain:', error);
      socket.emit('error', { message: 'Failed to join chain' });
    }
  });

  // Receive an update from a client (supports chunked transfer)
  socket.on('push-update', async ({ roomId, encryptedData, timestamp, chunkIndex, totalChunks }) => {
    try {
      // Validate room membership
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.roomId !== roomId) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }

      // Validate encryptedData size to prevent DoS (max 5MB)
      if (!encryptedData || typeof encryptedData !== 'string') {
        socket.emit('error', { message: 'Invalid data format' });
        return;
      }
      if (encryptedData.length > 5 * 1024 * 1024) {
        socket.emit('error', { message: 'Data too large (max 5MB)' });
        return;
      }

      // Rate limiting: max 30 updates per minute per socket
      const now = Date.now();
      if (!meta._rateWindow || now - meta._rateWindow > 60000) {
        meta._rateWindow = now;
        meta._rateCount = 0;
      }
      meta._rateCount = (meta._rateCount || 0) + 1;
      if (meta._rateCount > 30) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      const payload = {
        encryptedData,
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        deviceName: meta.deviceName,
        version: Date.now(),
      };

      // 保存到内存存储
      chainStore.set(roomId, payload);

      // 尝试保存到持久化存储
      if (persistenceManager) {
        try {
          await persistenceManager.saveRoom(roomId, payload);
        } catch (error) {
          console.error('Failed to save room to persistence:', error);
          // 持久化失败不影响实时同步
        }
      }

      // Broadcast to everyone else in the chain
      socket.to(roomId).emit('sync-update', payload);

      // Acknowledge receipt
      socket.emit('update-ack', { timestamp, success: true });
    } catch (error) {
      console.error('Error in push-update:', error);
      socket.emit('error', { message: 'Failed to push update' });
    }
  });

  // Request sync (for reconnection scenarios)
  socket.on('request-sync', async ({ roomId }) => {
    try {
      let existingData = null;

      // 尝试从持久化存储获取数据
      if (persistenceManager) {
        try {
          existingData = await persistenceManager.getRoom(roomId);
        } catch (error) {
          console.error('Failed to get room from persistence:', error);
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
      console.error('Error in request-sync:', error);
    }
  });

  // Ping for latency measurement
  socket.on('ping-latency', (callback) => {
    if (typeof callback === 'function') {
      callback({ timestamp: Date.now() });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[${new Date().toISOString()}] User disconnected: ${socket.id}, reason: ${reason}`);
    if (socketMeta.has(socket.id)) {
      const { roomId } = socketMeta.get(socket.id);
      socketMeta.delete(socket.id);
      // Notify others that this device left
      updateRoomMembers(roomId);
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
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
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    if (server.listening) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('HTTP server closed');
    }

    // 关闭持久化存储
    if (persistenceManager) {
      await persistenceManager.close();
      console.log('Persistence layer closed');
      persistenceManager = null;
    }

    console.log('Graceful shutdown completed');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}


async function startServer() {
  try {
    // 初始化持久化存储
    await initializePersistence();

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, '0.0.0.0', () => {
        server.off('error', reject);
        console.log(`🚀 Secure Note Sync Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`📈 Stats: http://localhost:${PORT}/stats`);

        if (persistenceManager) {
          console.log(`💾 Persistence: ${persistenceManager.getCurrentAdapter()}`);
        } else {
          console.log(`⚠️  Persistence: In-memory only`);
        }

        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
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
  initializePersistence,
  updateRoomMembers,
  gracefulShutdown,
  handleSocketConnection,
  stores: {
    chainStore,
    socketMeta,
    chunkStore,
  },
};

if (require.main === module) {
  startServer();
}
