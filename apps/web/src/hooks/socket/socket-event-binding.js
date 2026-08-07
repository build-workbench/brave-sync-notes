import toast from 'react-hot-toast';
import { processEncryptedSyncPayload } from './socket-sync-utils';

export const bindSocketEvents = ({
  socket,
  keys,
  name,
  t,
  setStatus,
  setMembers,
  initOfflineQueue,
  processQueuedOperations,
  handleRemoteContent,
  reconnectAttemptRef,
  isReconnectingRef,
  processSyncPayload = processEncryptedSyncPayload,
}) => {
  socket.on('connect', async () => {
    setStatus('connected');
    reconnectAttemptRef.current = 0;

    socket.emit('join-chain', {
      roomId: keys.roomId,
      deviceName: name,
    });

    await initOfflineQueue();
    await processQueuedOperations();

    if (isReconnectingRef.current) {
      toast.success(t.reconnected);
      isReconnectingRef.current = false;
    } else {
      toast.success(t.connected);
    }
  });

  socket.on('sync-update', async (payload) => {
    if (payload && payload.encryptedData) {
      try {
        await processSyncPayload({
          payload,
          encryptionKey: keys.encryptionKey,
          onRemoteContent: handleRemoteContent,
        });
      } catch (err) {
        console.error('Decryption error:', err);
      }
    }
  });

  socket.on('room-info', (data) => {
    if (data && data.members) {
      setMembers(data.members);
    }
  });

  socket.on('disconnect', (reason) => {
    setStatus('disconnected');
    if (reason !== 'io client disconnect') {
      toast.error(t.disconnected);
    }
  });

  socket.on('reconnect_attempt', (attempt) => {
    reconnectAttemptRef.current = attempt;
    isReconnectingRef.current = true;
    setStatus('syncing');
    if (attempt === 1) {
      toast.loading(t.reconnecting, { id: 'reconnecting' });
    }
  });

  socket.on('reconnect', async () => {
    toast.dismiss('reconnecting');
    socket.emit('join-chain', {
      roomId: keys.roomId,
      deviceName: name,
    });
    await processQueuedOperations();
  });

  socket.on('reconnect_failed', () => {
    toast.dismiss('reconnecting');
    toast.error(t.disconnected);
    setStatus('disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    if (reconnectAttemptRef.current === 0) {
      setStatus('disconnected');
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    toast.error(t.syncError);
  });
};
