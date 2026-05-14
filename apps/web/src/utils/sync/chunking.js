/**
 * 分块传输工具
 * 处理大文件的分块和重组
 */

// Chunk size for large content (50KB)
export const CHUNK_SIZE = 50 * 1024;

/**
 * 将内容分割成块
 * @param {string} content - 要分割的内容
 * @returns {Array<{index: number, total: number, data: string}>}
 */
export const splitIntoChunks = (content) => {
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

/**
 * 创建块会话管理器
 * @returns {Object} 会话管理器
 */
export const createChunkSessionManager = () => {
  const pendingChunks = {};

  return {
    /**
     * 重组接收到的块
     * @param {string} sessionId - 会话ID
     * @param {Object} chunk - 块数据
     * @returns {string|null} 完整内容或null（如果还有块未接收）
     */
    reassemble(sessionId, chunk) {
      if (!pendingChunks[sessionId]) {
        pendingChunks[sessionId] = {
          chunks: new Array(chunk.total),
          received: 0,
          total: chunk.total,
          startTime: Date.now(),
        };
      }

      const session = pendingChunks[sessionId];

      // Prevent duplicate chunks
      if (session.chunks[chunk.index] !== undefined) {
        return null;
      }

      session.chunks[chunk.index] = chunk.data;
      session.received++;

      if (session.received === session.total) {
        const fullContent = session.chunks.join('');
        delete pendingChunks[sessionId];
        return fullContent;
      }

      return null;
    },

    /**
     * 清理过期的会话
     * @param {number} timeout - 超时时间（毫秒）
     */
    cleanupStale(timeout = 30000) {
      const now = Date.now();
      for (const [sessionId, session] of Object.entries(pendingChunks)) {
        if (now - session.startTime > timeout) {
          delete pendingChunks[sessionId];
        }
      }
    },

    /**
     * 清除所有会话
     */
    clear() {
      Object.keys(pendingChunks).forEach(key => delete pendingChunks[key]);
    },
  };
};

export default {
  CHUNK_SIZE,
  splitIntoChunks,
  createChunkSessionManager,
};
