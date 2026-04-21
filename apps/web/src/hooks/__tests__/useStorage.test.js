import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStorage } from '../useStorage';

// Mock storage manager
vi.mock('../utils/storage', () => ({
  getStorageManager: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(undefined),
    getStorageType: vi.fn().mockReturnValue('indexeddb'),
    saveNotebook: vi.fn().mockResolvedValue(undefined),
    getNotebook: vi.fn().mockResolvedValue(null),
    listNotebooks: vi.fn().mockResolvedValue([]),
    deleteNotebook: vi.fn().mockResolvedValue(undefined),
    saveNote: vi.fn().mockResolvedValue(undefined),
    getNote: vi.fn().mockResolvedValue(null),
    listNotes: vi.fn().mockResolvedValue([]),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    saveHistory: vi.fn().mockResolvedValue(undefined),
    getHistory: vi.fn().mockResolvedValue([]),
    cleanupHistory: vi.fn().mockResolvedValue(undefined),
    enqueueOperation: vi.fn().mockResolvedValue('op-id'),
    dequeueOperations: vi.fn().mockResolvedValue([]),
    clearQueue: vi.fn().mockResolvedValue(undefined),
    removeOperation: vi.fn().mockResolvedValue(undefined),
    getStorageUsage: vi.fn().mockResolvedValue({ used: 0, quota: 0 }),
    cleanup: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStorage());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.storageType).toBe(null);
  });

  it('should provide storage operations', () => {
    const { result } = renderHook(() => useStorage());

    expect(typeof result.current.initialize).toBe('function');
    expect(typeof result.current.saveNote).toBe('function');
    expect(typeof result.current.getNote).toBe('function');
    expect(typeof result.current.deleteNote).toBe('function');
    expect(typeof result.current.getAllNotes).toBe('function');
  });

  it('should provide notebook operations', () => {
    const { result } = renderHook(() => useStorage());

    expect(typeof result.current.saveNotebook).toBe('function');
    expect(typeof result.current.getNotebook).toBe('function');
    expect(typeof result.current.listNotebooks).toBe('function');
    expect(typeof result.current.deleteNotebook).toBe('function');
  });

  it('should provide history operations', () => {
    const { result } = renderHook(() => useStorage());

    expect(typeof result.current.saveHistory).toBe('function');
    expect(typeof result.current.getHistory).toBe('function');
    expect(typeof result.current.cleanupHistory).toBe('function');
  });

  it('should provide queue operations', () => {
    const { result } = renderHook(() => useStorage());

    expect(typeof result.current.enqueueOperation).toBe('function');
    expect(typeof result.current.dequeueOperations).toBe('function');
    expect(typeof result.current.clearQueue).toBe('function');
    expect(typeof result.current.removeOperation).toBe('function');
  });
});
