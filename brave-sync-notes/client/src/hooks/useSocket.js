import { useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '../store/useStore';
import { deriveKeys, encryptData, decryptData } from '../utils/crypto';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

// Chunk size for large content (50KB)
const CHUNK_SIZE = 50 * 1024;

const messages = {
  en: {
    connected: 'Connected to sync chain',
    disconnected: 'Disconnected from server',
    syncError: 'Sync error occurred',
    joinError: 'Failed to join chain',
  },
  zh: {
    connected: '已连接到同步链',
    disconnected: '与服务器断开连接',
    syncError: '同步出错',
    joinError: '加入同步链失败',
  },
};

export const useSocket = () => {
  const socketRef = useRef(null);
  const keysRef = useRef(null);
  const pendingChunksRef = useRef({});
  
  const {
    setStatus,
    setNote,
    setMembers,
    setView,
    addToHistory,
    syncDebounceMs,
    lang,
  } = useAppStore();

  const t = messages[lang] || messages.zh;

  // Split content into chunks for large files
  const splitIntoChunks = (content) => {
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
  };

  // Reassemble chunks
  const reassembleChunks = (sessionId, chunk) => {
    if (!pendingChunksRef.current[sessionId]) {
      pendingChunksRef.current[sessionId] = {
        chunks: new Array(chunk.total),
        received: 0,
        total: chunk.total,
      };
    }
    
    const session = pendingChunksRef.current[sessionId];
    session.chunks[chunk.index] = chunk.data;
    session.received++;
    
    if (session.received === session.total) {
      const fullContent = session.chunks.join('');
      delete pendingChunksRef.current[sessionId];
      return fullContent;
    }
    
    return null;
  };

  const joinChain = useCallback((chainMnemonic, name) => {
    try {
      const keys = deriveKeys(chainMnemonic);
      keysRef.current = keys;
      
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        setStatus('connected');
        socketRef.current.emit('join-chain', {
          roomId: keys.roomId,
          deviceName: name,
        });
        toast.success(t.connected);
      });

      socketRef.current.on('sync-update', (payload) => {
        if (payload && payload.encryptedData) {
          const decrypted = decryptData(payload.encryptedData, keys.encryptionKey);
          if (decrypted) {
            // Handle chunked content
            if (decrypted.chunked) {
              const fullContent = reassembleChunks(decrypted.sessionId, decrypted.chunk);
              if (fullContent !== null) {
                setNote(fullContent);
                addToHistory({ content: fullContent, deviceName: payload.deviceName });
              }
            } else if (decrypted.content !== undefined) {
              setNote(decrypted.content);
              // Only add to history for significant changes
              if (decrypted.content.length > 10) {
                addToHistory({ content: decrypted.content, deviceName: payload.deviceName });
              }
            }
          }
        }
      });

      socketRef.current.on('room-info', (data) => {
        if (data && data.members) {
          setMembers(data.members);
        }
      });

      socketRef.current.on('disconnect', () => {
        setStatus('disconnected');
        toast.error(t.disconnected);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setStatus('disconnected');
      });

      setView('app');
      return true;
    } catch (e) {
      console.error('Error joining chain', e);
      toast.error(t.joinError);
      return false;
    }
  }, [setStatus, setNote, setMembers, setView, addToHistory, t]);

  // Debounced push update
  const debouncedPush = useCallback(
    debounce((content) => {
      if (!socketRef.current || !keysRef.current) return;
      
      const chunks = splitIntoChunks(content);
      const sessionId = Date.now().toString();
      
      chunks.forEach((chunk, index) => {
        const dataToEncrypt = chunks.length === 1
          ? { content }
          : { chunked: true, sessionId, chunk };
        
        const encrypted = encryptData(dataToEncrypt, keysRef.current.encryptionKey);
        
        socketRef.current.emit('push-update', {
          roomId: keysRef.current.roomId,
          encryptedData: encrypted,
          timestamp: Date.now(),
          chunkIndex: index,
          totalChunks: chunks.length,
        });
      });
      
      setStatus('connected');
    }, syncDebounceMs),
    [syncDebounceMs, setStatus]
  );

  const pushUpdate = useCallback((content) => {
    setStatus('syncing');
    debouncedPush(content);
  }, [debouncedPush, setStatus]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    keysRef.current = null;
  }, []);

  const getSocketId = useCallback(() => {
    return socketRef.current?.id;
  }, []);

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
    isConnected: () => socketRef.current?.connected,
  };
};
