import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockSocket, toast } = vi.hoisted(() => ({
  mockSocket: {
    connected: true,
    id: 'socket-1',
    handlers: {},
    emit: vi.fn(),
    on: vi.fn((event, handler) => {
      mockSocket.handlers[event] = handler;
      return mockSocket;
    }),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => {
      mockSocket.handlers = {};
    }),
    connect: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('react-hot-toast', () => ({
  default: toast,
}));

vi.mock('../utils/crypto', async () => {
  const actual = await vi.importActual('../utils/crypto');
  return {
    ...actual,
    encryptData: vi.fn((data) => JSON.stringify(data)),
    decryptData: vi.fn((ciphertext) => JSON.parse(ciphertext)),
  };
});

import { useSocket } from './useSocket';
import { useAppStore } from '../store/useStore';
import { deriveKeys } from '../utils/crypto';

const resetStore = () => {
  useAppStore.setState({
    view: 'landing',
    status: 'disconnected',
    note: '',
    noteVersion: 0,
    noteTimestamp: 0,
    noteDeviceId: 'local',
    deviceName: 'Local Device',
    members: [],
    history: [],
    lang: 'zh',
    syncDebounceMs: 0,
  });
};

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = true;
    mockSocket.id = 'socket-1';
    mockSocket.handlers = {};
    resetStore();
  });

  afterEach(() => {
    mockSocket.handlers = {};
  });

  it('joins the derived room and updates view/status on connect', async () => {
    const { result } = renderHook(() => useSocket());
    const mnemonic = 'test test test test test test test test test test test ball';
    const keys = deriveKeys(mnemonic);

    let joinPromise;
    await act(async () => {
      joinPromise = result.current.joinChain(mnemonic, 'MacBook');
    });

    expect(typeof mockSocket.handlers.connect).toBe('function');

    act(() => {
      mockSocket.handlers.connect();
    });

    await expect(joinPromise).resolves.toBe(true);

    expect(mockSocket.emit).toHaveBeenCalledWith('join-chain', {
      roomId: keys.roomId,
      deviceName: 'MacBook',
    });
    expect(useAppStore.getState().view).toBe('app');
    expect(useAppStore.getState().status).toBe('connected');
    expect(toast.success).toHaveBeenCalled();
  });

  it('applies sync-update payloads to store and history', async () => {
    const { result } = renderHook(() => useSocket());
    const mnemonic = 'test test test test test test test test test test test ball';

    await act(async () => {
      const joinPromise = result.current.joinChain(mnemonic, 'MacBook');
      mockSocket.handlers.connect();
      await joinPromise;
    });

    await act(async () => {
      await mockSocket.handlers['sync-update']({
        encryptedData: JSON.stringify({ content: 'remote note content' }),
        timestamp: 123456,
        deviceName: 'Remote Device',
        version: 2,
      });
    });

    const state = useAppStore.getState();
    expect(state.note).toBe('remote note content');
    expect(state.noteVersion).toBe(2);
    expect(state.noteDeviceId).toBe('Remote Device');
    expect(state.history[0]?.content).toBe('remote note content');
  });

  it('requests latest sync only when connected and joined', async () => {
    const { result } = renderHook(() => useSocket());
    const mnemonic = 'test test test test test test test test test test test ball';
    const keys = deriveKeys(mnemonic);

    await act(async () => {
      const joinPromise = result.current.joinChain(mnemonic, 'MacBook');
      mockSocket.handlers.connect();
      await joinPromise;
    });

    mockSocket.emit.mockClear();

    act(() => {
      result.current.requestSync();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('request-sync', { roomId: keys.roomId });
  });

  it('handles socket errors by surfacing sync feedback', async () => {
    const { result } = renderHook(() => useSocket());
    const mnemonic = 'test test test test test test test test test test test ball';

    await act(async () => {
      const joinPromise = result.current.joinChain(mnemonic, 'MacBook');
      mockSocket.handlers.connect();
      await joinPromise;
    });

    act(() => {
      mockSocket.handlers.error({ message: 'boom' });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
