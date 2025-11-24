const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory storage
// Key: RoomID (Public Hash), Value: Encrypted Data Blob
const chainStore = new Map();

// Track socket metadata: socketId -> { roomId, deviceName }
const socketMeta = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a specific sync chain
  socket.on('join-chain', ({ roomId, deviceName }) => {
    // Leave previous room if any
    if (socketMeta.has(socket.id)) {
      const oldRoom = socketMeta.get(socket.id).roomId;
      socket.leave(oldRoom);
      updateRoomMembers(oldRoom);
    }

    socket.join(roomId);
    // Store metadata for this socket
    socketMeta.set(socket.id, { roomId, deviceName: deviceName || 'Unknown Device' });
    
    console.log(`Socket ${socket.id} (${deviceName}) joined chain: ${roomId}`);

    // 1. Send existing data to the new device
    if (chainStore.has(roomId)) {
      socket.emit('sync-update', chainStore.get(roomId));
    }

    // 2. Broadcast updated member list to everyone in the room
    updateRoomMembers(roomId);
  });

  // Receive an update from a client
  socket.on('push-update', ({ roomId, encryptedData, timestamp }) => {
    const payload = { encryptedData, timestamp };
    chainStore.set(roomId, payload);
    
    // Broadcast to everyone else in the chain
    socket.to(roomId).emit('sync-update', payload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socketMeta.has(socket.id)) {
      const { roomId } = socketMeta.get(socket.id);
      socketMeta.delete(socket.id);
      // Notify others that this device left
      updateRoomMembers(roomId);
    }
  });
});

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
        status: 'online'
      });
    }
  }

  io.to(roomId).emit('room-info', { members });
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Brave-like Sync Server running on port ${PORT}`);
});
