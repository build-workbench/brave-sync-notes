import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../store/useStore';
import { deriveKeys, encryptData, decryptData } from '../utils/crypto';
import { ConflictService } from '../utils/conflict';
import { OfflineQueue } from '../utils/offline';
import { getStorageManager } from '../utils/storage';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';
import {
  getSocketUrl,
  getMessages,
  hashContent,
  splitIntoChunks,
  createChunkSessionManager,
  HISTORY_THROTTLE_MS,
  MAX_RECONNECTION_ATTEMPTS,
  RECONNECTION_DELAY_MIN,
  RECONNECTION_DELAY_MAX,
  SOCKET_TIMEOUT,
  CHUNK_SESSION_TIMEOUT,
  CHUNK_CLEANUP_INTERVAL,
} from '../utils/sync';

/**
 * 同步 Socket Hook
 * 管理实时同步连接、冲突处理和离线队列
 */
export const useSocket = () => {
  // Refs for socket and connection state
  const socketRef = useRef(null);
  const keysRef = useRef(null);
  const debouncedPushRef = useRef(null);
  const lastHistorySaveRef = useRef(0);
  const lastContentHashRef = useRef('');
  const lastSyncedHashRef = useRef('');
  const reconnectAttemptRef = useRef(0);
  const isReconnectingRef = useRef(false);

  // Chunk session manager
  const chunkManagerRef = useRef(createChunkSessionManager());

  // Conflict management
  const conflictManagerRef = useRef(null);
  const [pendingConflicts, setPendingConflicts] = useState([]);
  const [conflictCount, setConflictCount] = useState(0);

  // Offline queue
  const offlineQueueRef = useRef(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Store selectors
  const setStatus = useAppStore((state) => state.setStatus);
  const setNote = useAppStore((state) => state.setNote);
  const setMembers = useAppStore((state) => state.setMembers);
  const setView = useAppStore((state) => state.setView);
  const addToHistory = useAppStore((state) => state.addToHistory);
  const syncDebounceMs = useAppStore((state) => state.syncDebounceMs);
  const lang = useAppStore((state) => state.lang);

  const t = useMemo(() => getMessages(lang), [lang]);

  // Initialize conflict manager
  if (!conflictManagerRef.current) {
    conflictManagerRef.current = new ConflictService({ autoResolveStrategy: 'manual' });
  }

  // ==================== Initialization ====================

  const initOfflineQueue = useCallback(async () => {
    if (offlineQueueRef.current) return offlineQueueRef.current;

    try {
      const storage = getStorageManager();
      await storage.initialize();
      offlineQueueRef.current = new OfflineQueue(storage);
      const size = await offlineQueueRef.current.getQueueSize();
      setQueueSize(size);
      return offlineQueueRef.current;
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      return null;
    }
  }, []);

  // ==================== Offline Detection ====================

  const isOffline = useCallback(() => {
    return !navigator.onLine || !socketRef.current?.connected;
  }, []);

  // ==================== History Management ====================

  const saveToHistory = useCallback((content, deviceName) => {
    const now = Date.now();
    const contentHash = hashContent(content);

    // Skip if same content or too soon
    if (
      contentHash === lastContentHashRef.current ||
      now - lastHistorySaveRef.current < HISTORY_THROTTLE_MS ||
      content.length < 10
    ) {
      return;
    }

    lastHistorySaveRef.current = now;
    lastContentHashRef.current = contentHash;
    addToHistory({ content, deviceName });
  }, [addToHistory]);

  // ==================== Content Push ====================

  const pushContent = useCallback((content) => {
    if (!socketRef.current?.connected || !keysRef.current) {
      setStatus('disconnected');
      return;
    }

    try {
      const chunks = splitIntoChunks(content);
      const sessionId = Date.now().toString();

      chunks.forEach((chunk) => {
        const dataToEncrypt = chunks.length === 1
          ? { content }
          : { chunked: true, sessionId, chunk };

        const encrypted = encryptData(dataToEncrypt, keysRef.current.encryptionKey);

        socketRef.current.emit('push-update', {
          roomId: keysRef.current.roomId,
          encryptedData: encrypted,
          timestamp: Date.now(),
          chunkIndex: chunk.index,
          totalChunks: chunks.length,
        });
      });

      lastSyncedHashRef.current = hashContent(content);
      setStatus('connected');
    } catch (err) {
      console.error('Push update error:', err);
      setStatus('disconnected');
    }
  }, [setStatus]);

  // Create debounced push function
  useEffect(() => {
    debouncedPushRef.current = debounce(pushContent, syncDebounceMs);

    return () => {
      if (debouncedPushRef.current) {
        debouncedPushRef.current.cancel();
      }
    };
  }, [syncDebounceMs, pushContent]);

  // ==================== Remote Content Handler ====================

  const handleRemoteContent = useCallback(async (remoteContent, payload) => {
    const state = useAppStore.getState();
    const localContent = state.note || '';
    const localHash = hashContent(localContent);
    const isDirty = localHash !== lastSyncedHashRef.current;

    const remoteMeta = {
      version: payload.version ?? 0,
      timestamp: payload.timestamp ?? Date.now(),
      deviceId: payload.deviceName || 'remote',
    };

    if (!isDirty || !conflictManagerRef.current) {
      setNote(remoteContent, remoteMeta);
      lastSyncedHashRef.current = hashContent(remoteContent);
      saveToHistory(remoteContent, payload.deviceName);
      return;
    }

    const result = await conflictManagerRef.current.checkAndHandle(
      {
        content: localContent,
        version: state.noteVersion || 0,
        timestamp: state.noteTimestamp || 0,
        deviceId: state.noteDeviceId || state.deviceName || 'local',
      },
      {
        content: remoteContent,
        version: remoteMeta.version,
        timestamp: remoteMeta.timestamp,
        deviceId: remoteMeta.deviceId,
      }
    );

    setPendingConflicts(conflictManagerRef.current.getPendingConflicts());
    setConflictCount(conflictManagerRef.current.getConflictCount());

    if (!result.hasConflict || result.resolved) {
      const nextContent = result.resolved ?? remoteContent;
      setNote(nextContent, remoteMeta);
      lastSyncedHashRef.current = hashContent(nextContent);
      saveToHistory(nextContent, payload.deviceName);
    }
  }, [setNote, saveToHistory]);

  // ==================== Queue Processing ====================

  const processQueuedOperations = useCallback(async () => {
    if (!offlineQueueRef.current || !socketRef.current?.connected || !keysRef.current) {
      return { processed: 0, failed: 0 };
    }

    setIsProcessingQueue(true);

    try {
      const results = await offlineQueueRef.current.processQueue(async (operation) => {
        if (operation.type !== 'update' || !operation.data) {
          return { success: false };
        }

        try {
          const content = operation.data;
          const chunks = splitIntoChunks(content);
          const sessionId = Date.now().toString();

          for (const chunk of chunks) {
            const dataToEncrypt = chunks.length === 1
              ? { content }
              : { chunked: true, sessionId, chunk };

            const encrypted = encryptData(dataToEncrypt, keysRef.current.encryptionKey);

            socketRef.current.emit('push-update', {
              roomId: keysRef.current.roomId,
              encryptedData: encrypted,
              timestamp: Date.now(),
              chunkIndex: chunk.index,
              totalChunks: chunks.length,
            });
          }

          lastSyncedHashRef.current = hashContent(content);
          return { success: true };
        } catch (err) {
          console.error('Failed to process queued operation:', err);
          return { success: false };
        }
      });

      const size = await offlineQueueRef.current.getQueueSize();
      setQueueSize(size);

      if (results.processed > 0) {
        toast.success(`Synced ${results.processed} offline change${results.processed > 1 ? 's' : ''}`);
      }

      return results;
    } finally {
      setIsProcessingQueue(false);
    }
  }, []);

  // ==================== Connection Management ====================

  const joinChain = useCallback((chainMnemonic, name) => {
    return new Promise((resolve) => {
      try {
        const socketUrl = getSocketUrl();
        if (!socketUrl) {
          toast.error('VITE_SOCKET_URL is required outside development');
          resolve(false);
          return;
        }

        const keys = deriveKeys(chainMnemonic);
        keysRef.current = keys;

        lastSyncedHashRef.current = '00';
        conflictManagerRef.current?.clearConflicts();
        setPendingConflicts([]);
        setConflictCount(0);

        // Tear down existing socket
        if (socketRef.current) {
          const oldSocket = socketRef.current;
          socketRef.current = null;
          oldSocket.removeAllListeners();
          oldSocket.disconnect();
        }

        // Cancel pending pushes
        if (debouncedPushRef.current) {
          debouncedPushRef.current.cancel();
        }
        chunkManagerRef.current.clear();

        // Create new socket
        socketRef.current = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
          reconnectionDelay: RECONNECTION_DELAY_MIN,
          reconnectionDelayMax: RECONNECTION_DELAY_MAX,
          timeout: SOCKET_TIMEOUT,
        });

        const socket = socketRef.current;

        // Event handlers
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
              const decrypted = decryptData(payload.encryptedData, keys.encryptionKey);
              if (decrypted) {
                // Handle chunked content
                if (decrypted.chunked) {
                  const fullContent = chunkManagerRef.current.reassemble(decrypted.sessionId, decrypted.chunk);
                  if (fullContent !== null) {
                    await handleRemoteContent(fullContent, payload);
                  }
                } else if (decrypted.content !== undefined) {
                  await handleRemoteContent(decrypted.content, payload);
                }
              }
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

        setView('app');
        resolve(true);
      } catch (e) {
        console.error('Error joining chain', e);
        toast.error(t.joinError);
        resolve(false);
      }
    });
  }, [setStatus, setMembers, setView, t, initOfflineQueue, processQueuedOperations, handleRemoteContent]);

  // ==================== Public API ====================

  const pushUpdate = useCallback(async (content) => {
    // If offline, queue the operation
    if (isOffline()) {
      const queue = await initOfflineQueue();
      if (queue && keysRef.current) {
        await queue.enqueue({
          type: 'update',
          data: content,
          timestamp: Date.now(),
          roomId: keysRef.current.roomId,
        });
        const size = await queue.getQueueSize();
        setQueueSize(size);
        toast.success(t.networkOffline || 'Changes queued for sync');
      }
      return;
    }

    setStatus('syncing');
    debouncedPushRef.current?.(content);
  }, [setStatus, isOffline, initOfflineQueue, t]);

  const disconnect = useCallback(() => {
    if (debouncedPushRef.current) {
      debouncedPushRef.current.cancel();
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    keysRef.current = null;
    chunkManagerRef.current.clear();
    conflictManagerRef.current?.clearConflicts();
    setPendingConflicts([]);
    setConflictCount(0);
    setQueueSize(0);
    setIsProcessingQueue(false);
  }, []);

  const resolveConflict = useCallback(async (conflictId, resolvedContent) => {
    if (!conflictManagerRef.current) return null;
    const resolved = await conflictManagerRef.current.resolveConflictById(conflictId, resolvedContent);
    setPendingConflicts(conflictManagerRef.current.getPendingConflicts());
    setConflictCount(conflictManagerRef.current.getConflictCount());
    return resolved;
  }, []);

  const clearConflicts = useCallback(() => {
    conflictManagerRef.current?.clearConflicts();
    setPendingConflicts([]);
    setConflictCount(0);
  }, []);

  const getSocketId = useCallback(() => socketRef.current?.id, []);

  const getCurrentRoomId = useCallback(() => keysRef.current?.roomId || null, []);

  const requestSync = useCallback(() => {
    if (socketRef.current?.connected && keysRef.current) {
      socketRef.current.emit('request-sync', { roomId: keysRef.current.roomId });
    }
  }, []);

  // ==================== Effects ====================

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      toast.success(t.networkOnline);
      if (socketRef.current && !socketRef.current.connected && keysRef.current) {
        socketRef.current.connect();
      }
    };

    const handleOffline = () => {
      toast.error(t.networkOffline);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t, setStatus]);

  // Cleanup stale chunk sessions
  useEffect(() => {
    const cleanup = setInterval(() => {
      chunkManagerRef.current.cleanupStale(CHUNK_SESSION_TIMEOUT);
    }, CHUNK_CLEANUP_INTERVAL);

    return () => clearInterval(cleanup);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    joinChain,
    pushUpdate,
    disconnect,
    getSocketId,
    getCurrentRoomId,
    requestSync,
    isConnected: () => socketRef.current?.connected ?? false,
    conflictCount,
    pendingConflicts,
    resolveConflict,
    clearConflicts,
    // Offline queue
    queueSize,
    isProcessingQueue,
    processQueuedOperations,
    isOffline,
  };
};
