import { describe, it, expect, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: toast,
}));

import { bindSocketEvents } from '../socket-event-binding';

const createMockSocket = () => {
  const handlers = {};
  return {
    handlers,
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
  };
};

describe('socket-event-binding', () => {
  it('binds connect handler that joins room and flushes queue', async () => {
    const socket = createMockSocket();
    const reconnectAttemptRef = { current: 5 };
    const isReconnectingRef = { current: false };
    const setStatus = vi.fn();
    const initOfflineQueue = vi.fn().mockResolvedValue(undefined);
    const processQueuedOperations = vi.fn().mockResolvedValue(undefined);

    bindSocketEvents({
      socket,
      keys: { roomId: 'room-1', encryptionKey: 'key-1' },
      name: 'Laptop',
      t: {
        connected: 'connected',
        disconnected: 'disconnected',
        reconnecting: 'reconnecting',
        reconnected: 'reconnected',
        syncError: 'sync-error',
      },
      setStatus,
      setMembers: vi.fn(),
      initOfflineQueue,
      processQueuedOperations,
      handleRemoteContent: vi.fn(),
      chunkManager: { reassemble: vi.fn() },
      reconnectAttemptRef,
      isReconnectingRef,
    });

    await socket.handlers.connect();

    expect(setStatus).toHaveBeenCalledWith('connected');
    expect(reconnectAttemptRef.current).toBe(0);
    expect(socket.emit).toHaveBeenCalledWith('join-chain', {
      roomId: 'room-1',
      deviceName: 'Laptop',
    });
    expect(initOfflineQueue).toHaveBeenCalled();
    expect(processQueuedOperations).toHaveBeenCalled();
  });

  it('uses processSyncPayload dependency for sync-update handling', async () => {
    const socket = createMockSocket();
    const processSyncPayload = vi.fn().mockResolvedValue(undefined);
    const payload = { encryptedData: 'ciphertext' };

    bindSocketEvents({
      socket,
      keys: { roomId: 'room-1', encryptionKey: 'key-1' },
      name: 'Laptop',
      t: {
        connected: 'connected',
        disconnected: 'disconnected',
        reconnecting: 'reconnecting',
        reconnected: 'reconnected',
        syncError: 'sync-error',
      },
      setStatus: vi.fn(),
      setMembers: vi.fn(),
      initOfflineQueue: vi.fn().mockResolvedValue(undefined),
      processQueuedOperations: vi.fn().mockResolvedValue(undefined),
      handleRemoteContent: vi.fn(),
      chunkManager: { reassemble: vi.fn() },
      reconnectAttemptRef: { current: 0 },
      isReconnectingRef: { current: false },
      processSyncPayload,
    });

    await socket.handlers['sync-update'](payload);

    expect(processSyncPayload).toHaveBeenCalledWith({
      payload,
      encryptionKey: 'key-1',
      chunkManager: expect.any(Object),
      onRemoteContent: expect.any(Function),
    });
  });
});
