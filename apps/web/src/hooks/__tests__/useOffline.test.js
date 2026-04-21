import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from '../useOffline';

// Mock the offline queue and storage
vi.mock('../utils/offline', () => ({
  OfflineQueue: vi.fn().mockImplementation(() => ({
    enqueue: vi.fn().mockResolvedValue('test-id'),
    getQueueSize: vi.fn().mockResolvedValue(0),
    clearQueue: vi.fn().mockResolvedValue(undefined),
    processQueue: vi.fn().mockResolvedValue({ processed: 0, failed: 0 }),
    getStatus: vi.fn().mockResolvedValue({ size: 0, isProcessing: false, operations: [] }),
    getAll: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../utils/storage', () => ({
  getStorageManager: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset online status
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });
  });

  it('should return online status initially', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(true);
  });

  it('should detect offline status when navigator.onLine is false', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(false);
  });

  it('should update status when going offline', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update status when coming online', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() => useOffline());

    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should provide queue operations', async () => {
    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(typeof result.current.enqueueOperation).toBe('function');
      expect(typeof result.current.processQueue).toBe('function');
      expect(typeof result.current.clearQueue).toBe('function');
      expect(typeof result.current.getQueueStatus).toBe('function');
    });
  });

  it('should have initial queue size of 0', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.queueSize).toBe(0);
  });

  it('should not be processing initially', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isProcessing).toBe(false);
  });
});
