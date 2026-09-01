/**
 * 同步相关常量和消息
 */
import { hashContent as sharedHashContent } from '../shared';

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
 * 哈希函数用于内容比较
 * 委托给共享实现：覆盖全部内容（而非前 1000 字符），
 * 避免尾部编辑被误判为"内容未变"导致静默覆盖。
 * @param {string} content - 内容
 * @returns {string} 哈希值
 */
export const hashContent = (content) => sharedHashContent(content);

// ==================== v2 信封协议 ====================

// 协议版本号(push-update/sync-update 信封必填)
export const PROTOCOL_VERSION = 2;

/**
 * 构造 AES-GCM additionalData。
 * 收发双方必须用完全一致的紧凑格式,避免 JSON 键序歧义;
 * 绑定 roomId/deviceId/seq/timestamp 后,密文跨上下文搬运即解密失败。
 * @param {string} roomId
 * @param {string} deviceId
 * @param {number} seq - 发送端单调序号
 * @param {number} timestamp
 * @returns {string}
 */
export const buildAad = (roomId, deviceId, seq, timestamp) =>
  `ns2|${roomId}|${deviceId}|${seq}|${timestamp}`;

// seq 计数器的 localStorage key 前缀(完整 key: `${PREFIX}${roomId}`)
export const SEQ_KEY_PREFIX = 'notesync-seq:';

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
  PROTOCOL_VERSION,
  buildAad,
  SEQ_KEY_PREFIX,
};
