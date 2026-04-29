import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../store/useStore';
import { deriveKeys, encryptData, decryptData } from '../utils/crypto';
import { ConflictManager } from '../utils/conflict';
import { OfflineQueue } from '../utils/offline';
import { getStorageManager } from '../utils/storage';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3002';
  }

  return null;
};

// Chunk size for large content (50KB)
const CHUNK_SIZE = 50 * 1024;

// Minimum interval between history saves (5 seconds)
const HISTORY_THROTTLE_MS = 5000;

const messages = {
  en: {
    connected: 'Connected to sync chain',
    disconnected: 'Disconnected from server',
    reconnecting: 'Reconnecting...',
    reconnected: 'Reconnected successfully',
    syncError: 'Sync error occurred',
    joinError: 'Failed to join chain',
    networkOffline: 'Network offline',
    networkOnline: 'Network restored',
  },
  zh: {
    connected: '已连接到同步链',
    disconnected: '与服务器断开连接',
    reconnecting: '正在重新连接...',
    reconnected: '重新连接成功',
    syncError: '同步出错',
    joinError: '加入同步链失败',
    networkOffline: '网络已断开',
    networkOnline: '网络已恢复',
  },
};

export const useSocket = () => {
  const socketRef = useRef(null);
  const keysRef = useRef(null);
  const pendingChunksRef = useRef({});
  const debouncedPushRef = useRef(null);
  const lastHistorySaveRef = useRef(0);
  const lastContentHashRef = useRef('');
  const lastSyncedHashRef = useRef('');
  const reconnectAttemptRef = useRef(0);
  const isReconnectingRef = useRef(false);

  const conflictManagerRef = useRef(null);
  const offlineQueueRef = useRef(null);
  const [pendingConflicts, setPendingConflicts] = useState([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // Get store values with selector to prevent unnecessary rerenders
  const setStatus = useAppStore((state) => state.setStatus);
  const setNote = useAppStore((state) => state.setNote);
  const setMembers = useAppStore((state) => state.setMembers);
  const setView = useAppStore((state) => state.setView);
  const addToHistory = useAppStore((state) => state.addToHistory);
  const syncDebounceMs = useAppStore((state) => state.syncDebounceMs);
  const lang = useAppStore((state) => state.lang);

  const t = useMemo(() => messages[lang] || messages.zh, [lang]);

  if (!conflictManagerRef.current) {
    conflictManagerRef.current = new ConflictManager({ autoResolveStrategy: 'manual' });
  }

  // Initialize offline queue
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

  // Check if offline (either network or socket disconnected)
  const isOffline = useCallback(() => {
    return !navigator.onLine || !socketRef.current?.connected;
  }, []);

  // Hash function for content comparison (optimized for large content)
  const hashContent = useCallback((content) => {
    let hash = 0;
    for (let i = 0; i < Math.min(content.length, 1000); i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString() + content.length;
  }, []);

  // Split content into chunks for large files
  const splitIntoChunks = useCallback((content) => {
    if (content.length <= CHUNK_SIZE) {
      return [{ index: 0, total: 1, data: content }];
    }
    
    const chunks = [];
    const totalChunks = Math.ceil(content.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      chunks.push({
        index: i,
        total: totalChunks,
        data: content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      });
    }
    
    return chunks;
  }, []);

  // Reassemble chunks
  const reassembleChunks = useCallback((sessionId, chunk) => {
    if (!pendingChunksRef.current[sessionId]) {
      pendingChunksRef.current[sessionId] = {
        chunks: new Array(chunk.total),
        received: 0,
        total: chunk.total,
        startTime: Date.now(),
      };
    }
    
    const session = pendingChunksRef.current[sessionId];
    
    // Prevent duplicate chunks
    if (session.chunks[chunk.index] !== undefined) {
      return null;
    }
    
    session.chunks[chunk.index] = chunk.data;
    session.received++;
    
    if (session.received === session.total) {
      const fullContent = session.chunks.join('');
      delete pendingChunksRef.current[sessionId];
      return fullContent;
    }
    
    return null;
  }, []);

  // Throttled history save
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
  }, [addToHistory, hashContent]);

  // Cleanup stale chunk sessions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of Object.entries(pendingChunksRef.current)) {
        if (now - session.startTime > 30000) { // 30 seconds timeout
          delete pendingChunksRef.current[sessionId];
        }
      }
    }, 10000);
    
    return () => clearInterval(cleanup);
  }, []);

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

  // Process queued operations on reconnection
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
  }, [splitIntoChunks, hashContent]);

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
        
        // Fully tear down existing socket before creating a new one
        // This prevents event listener leaks from rapid joinChain calls
        if (socketRef.current) {
          const oldSocket = socketRef.current;
          socketRef.current = null; // Clear ref immediately to prevent stale handlers
          oldSocket.removeAllListeners();
          oldSocket.disconnect();
        }

        // Cancel any pending debounced pushes from previous session
        if (debouncedPushRef.current) {
          debouncedPushRef.current.cancel();
        }
        pendingChunksRef.current = {};
        
        socketRef.current = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        const socket = socketRef.current;

        socket.on('connect', async () => {
          setStatus('connected');
          reconnectAttemptRef.current = 0;

          socket.emit('join-chain', {
            roomId: keys.roomId,
            deviceName: name,
          });

          // Initialize offline queue and process any pending operations
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
                const handleRemoteContent = async (remoteContent) => {
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
                };

                // Handle chunked content
                if (decrypted.chunked) {
                  const fullContent = reassembleChunks(decrypted.sessionId, decrypted.chunk);
                  if (fullContent !== null) {
                    await handleRemoteContent(fullContent);
                  }
                } else if (decrypted.content !== undefined) {
                  await handleRemoteContent(decrypted.content);
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
          // Re-join the room after reconnection
          socket.emit('join-chain', {
            roomId: keys.roomId,
            deviceName: name,
          });
          // Process any queued offline operations
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
  }, [setStatus, setNote, setMembers, setView, saveToHistory, reassembleChunks, t, hashContent, initOfflineQueue, processQueuedOperations]);

  // Create debounced push function
  useEffect(() => {
    debouncedPushRef.current = debounce((content) => {
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
    }, syncDebounceMs);

    return () => {
      if (debouncedPushRef.current) {
        debouncedPushRef.current.cancel();
      }
    };
  }, [syncDebounceMs, setStatus, splitIntoChunks, hashContent]);

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
    pendingChunksRef.current = {};
    conflictManagerRef.current?.clearConflicts();
    setPendingConflicts([]);
    setConflictCount(0);
    setQueueSize(0);
    setIsProcessingQueue(false);
  }, []);

  const resolveConflict = useCallback(async (conflictId, resolvedContent) => {
    if (!conflictManagerRef.current) return null;
    const resolved = await conflictManagerRef.current.resolveManually(conflictId, resolvedContent);
    setPendingConflicts(conflictManagerRef.current.getPendingConflicts());
    setConflictCount(conflictManagerRef.current.getConflictCount());
    return resolved;
  }, []);

  const clearConflicts = useCallback(() => {
    conflictManagerRef.current?.clearConflicts();
    setPendingConflicts([]);
    setConflictCount(0);
  }, []);

  const getSocketId = useCallback(() => {
    return socketRef.current?.id;
  }, []);

  const getCurrentRoomId = useCallback(() => {
    return keysRef.current?.roomId || null;
  }, []);

  const requestSync = useCallback(() => {
    if (socketRef.current?.connected && keysRef.current) {
      socketRef.current.emit('request-sync', { roomId: keysRef.current.roomId });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
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
