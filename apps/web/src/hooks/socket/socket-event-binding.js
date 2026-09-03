import toast from 'react-hot-toast';
import { processEncryptedSyncPayload } from './socket-sync-utils';

// 允许传入函数以惰性解析文案,避免语言切换后仍使用加入时的旧快照
const resolveT = (t) => (typeof t === 'function' ? t() : t);

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
  syncOnlineStatus,
  reconnectAttemptRef,
  isReconnectingRef,
  processSyncPayload = processEncryptedSyncPayload,
}) => {
  socket.on('connect', async () => {
    setStatus('connected');
    if (typeof syncOnlineStatus === 'function') {
      syncOnlineStatus();
    }
    reconnectAttemptRef.current = 0;

    socket.emit('join-chain', {
      roomId: keys.roomId,
      deviceName: name,
    });

    // 离线队列等 join-ack 确认后再冲刷:join 未完成时 push-update
    // 会被服务端以 NOT_MEMBER 拒绝,确认机制保证失败操作留在队列重试
  });

  // 服务端确认加入成功后才处理离线队列
  socket.on('join-ack', async () => {
    await initOfflineQueue();
    await processQueuedOperations();

    if (isReconnectingRef.current) {
      toast.success(resolveT(t).reconnected);
      isReconnectingRef.current = false;
    } else {
      toast.success(resolveT(t).connected);
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
    if (typeof syncOnlineStatus === 'function') {
      syncOnlineStatus();
    }
    if (reason !== 'io client disconnect') {
      toast.error(resolveT(t).disconnected);
    }
  });

  socket.on('reconnect_attempt', (attempt) => {
    reconnectAttemptRef.current = attempt;
    isReconnectingRef.current = true;
    setStatus('syncing');
    if (attempt === 1) {
      toast.loading(resolveT(t).reconnecting, { id: 'reconnecting' });
    }
  });

  // socket.io 重连必然先触发 connect(已重新 join-chain 并冲刷队列),
  // 这里只负责清理重连提示,避免重复 join。
  socket.on('reconnect', () => {
    toast.dismiss('reconnecting');
  });

  socket.on('reconnect_failed', () => {
    toast.dismiss('reconnecting');
    toast.error(resolveT(t).disconnected);
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
    toast.error(resolveT(t).syncError);
  });
};
