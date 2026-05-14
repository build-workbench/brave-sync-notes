/**
 * 同步相关常量和消息
 */

// Minimum interval between history saves (5 seconds)
export const HISTORY_THROTTLE_MS = 5000;

// Default sync debounce interval (ms)
export const DEFAULT_SYNC_DEBOUNCE_MS = 300;

// Maximum reconnection attempts
export const MAX_RECONNECTION_ATTEMPTS = 10;

// Reconnection delay range (ms)
export const RECONNECTION_DELAY_MIN = 1000;
export const RECONNECTION_DELAY_MAX = 5000;

// Socket connection timeout (ms)
export const SOCKET_TIMEOUT = 20000;

// Chunk session timeout (ms)
export const CHUNK_SESSION_TIMEOUT = 30000;

// Chunk session cleanup interval (ms)
export const CHUNK_CLEANUP_INTERVAL = 10000;

/**
 * 多语言消息
 */
export const messages = {
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

/**
 * 获取消息翻译
 * @param {string} lang - 语言代码
 * @returns {Object} 消息对象
 */
export const getMessages = (lang) => messages[lang] || messages.zh;

/**
 * 哈希函数用于内容比较（针对大内容优化）
 * @param {string} content - 内容
 * @returns {string} 哈希值
 */
export const hashContent = (content) => {
  let hash = 0;
  for (let i = 0; i < Math.min(content.length, 1000); i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString() + content.length;
};

/**
 * 获取 Socket URL
 * @returns {string|null}
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3002';
  }

  return null;
};

export default {
  HISTORY_THROTTLE_MS,
  DEFAULT_SYNC_DEBOUNCE_MS,
  MAX_RECONNECTION_ATTEMPTS,
  RECONNECTION_DELAY_MIN,
  RECONNECTION_DELAY_MAX,
  SOCKET_TIMEOUT,
  CHUNK_SESSION_TIMEOUT,
  CHUNK_CLEANUP_INTERVAL,
  messages,
  getMessages,
  hashContent,
  getSocketUrl,
};
