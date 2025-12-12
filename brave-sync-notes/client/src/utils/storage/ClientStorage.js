/**
 * 客户端存储接口
 * 定义了所有客户端存储实现必须遵循的接口
 */

/**
 * 笔记本数据结构
 * @typedef {Object} Notebook
 * @property {string} id - 笔记本唯一标识符
 * @property {string} name - 笔记本名称
 * @property {string} mnemonic - 12词助记词
 * @property {string} encryptionKey - 加密密钥
 * @property {string} roomId - 服务器房间ID
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

/**
 * 笔记数据结构
 * @typedef {Object} Note
 * @property {string} id - 笔记唯一标识符
 * @property {string} notebookId - 所属笔记本ID
 * @property {string} title - 笔记标题
 * @property {string} content - 笔记内容
 * @property {string[]} tags - 标签列表
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 * @property {number} version - 版本号
 */

/**
 * 历史记录条目
 * @typedef {Object} HistoryEntry
 * @property {string} id - 历史记录唯一标识符
 * @property {string} noteId - 关联的笔记ID
 * @property {string} content - 历史内容
 * @property {string} [delta] - 与前一版本的差异
 * @property {number} version - 版本号
 * @property {number} timestamp - 时间戳
 * @property {string} deviceName - 设备名称
 * @property {string[]} tags - 标签列表
 */

/**
 * 待处理操作
 * @typedef {Object} PendingOperation
 * @property {string} id - 操作唯一标识符
 * @property {string} type - 操作类型 ('update' | 'create' | 'delete')
 * @property {string} notebookId - 笔记本ID
 * @property {string} [noteId] - 笔记ID（可选）
 * @property {any} data - 操作数据
 * @property {number} timestamp - 时间戳
 * @property {number} retries - 重试次数
 */

/**
 * 客户端存储抽象类
 */
class ClientStorage {
    /**
     * 初始化存储
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error('initialize method must be implemented');
    }

    /**
     * 检查存储是否可用
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        throw new Error('isAvailable method must be implemented');
    }

    // ========== 笔记本操作 ==========

    /**
     * 保存笔记本
     * @param {Notebook} notebook - 笔记本数据
     * @returns {Promise<void>}
     */
    async saveNotebook(notebook) {
        throw new Error('saveNotebook method must be implemented');
    }

    /**
     * 获取笔记本
     * @param {string} id - 笔记本ID
     * @returns {Promise<Notebook|null>}
     */
    async getNotebook(id) {
        throw new Error('getNotebook method must be implemented');
    }

    /**
     * 列出所有笔记本
     * @returns {Promise<Notebook[]>}
     */
    async listNotebooks() {
        throw new Error('listNotebooks method must be implemented');
    }

    /**
     * 删除笔记本
     * @param {string} id - 笔记本ID
     * @returns {Promise<void>}
     */
    async deleteNotebook(id) {
        throw new Error('deleteNotebook method must be implemented');
    }

    // ========== 笔记操作 ==========

    /**
     * 保存笔记
     * @param {string} notebookId - 笔记本ID
     * @param {Note} note - 笔记数据
     * @returns {Promise<void>}
     */
    async saveNote(notebookId, note) {
        throw new Error('saveNote method must be implemented');
    }

    /**
     * 获取笔记
     * @param {string} notebookId - 笔记本ID
     * @param {string} noteId - 笔记ID
     * @returns {Promise<Note|null>}
     */
    async getNote(notebookId, noteId) {
        throw new Error('getNote method must be implemented');
    }

    /**
     * 列出笔记本中的所有笔记
     * @param {string} notebookId - 笔记本ID
     * @returns {Promise<Note[]>}
     */
    async listNotes(notebookId) {
        throw new Error('listNotes method must be implemented');
    }

    /**
     * 删除笔记
     * @param {string} notebookId - 笔记本ID
     * @param {string} noteId - 笔记ID
     * @returns {Promise<void>}
     */
    async deleteNote(notebookId, noteId) {
        throw new Error('deleteNote method must be implemented');
    }

    // ========== 历史记录操作 ==========

    /**
     * 保存历史记录
     * @param {string} noteId - 笔记ID
     * @param {HistoryEntry} entry - 历史记录条目
     * @returns {Promise<void>}
     */
    async saveHistory(noteId, entry) {
        throw new Error('saveHistory method must be implemented');
    }

    /**
     * 获取历史记录
     * @param {string} noteId - 笔记ID
     * @param {number} [limit] - 限制返回数量
     * @returns {Promise<HistoryEntry[]>}
     */
    async getHistory(noteId, limit) {
        throw new Error('getHistory method must be implemented');
    }

    /**
     * 清理旧的历史记录
     * @param {string} noteId - 笔记ID
     * @param {number} keepCount - 保留的记录数量
     * @returns {Promise<number>} 删除的记录数量
     */
    async cleanupHistory(noteId, keepCount) {
        throw new Error('cleanupHistory method must be implemented');
    }

    // ========== 离线队列操作 ==========

    /**
     * 添加操作到队列
     * @param {PendingOperation} op - 待处理操作
     * @returns {Promise<void>}
     */
    async enqueueOperation(op) {
        throw new Error('enqueueOperation method must be implemented');
    }

    /**
     * 获取所有待处理操作
     * @returns {Promise<PendingOperation[]>}
     */
    async dequeueOperations() {
        throw new Error('dequeueOperations method must be implemented');
    }

    /**
     * 清空队列
     * @returns {Promise<void>}
     */
    async clearQueue() {
        throw new Error('clearQueue method must be implemented');
    }

    /**
     * 删除特定操作
     * @param {string} operationId - 操作ID
     * @returns {Promise<void>}
     */
    async removeOperation(operationId) {
        throw new Error('removeOperation method must be implemented');
    }

    // ========== 存储管理 ==========

    /**
     * 获取存储使用情况
     * @returns {Promise<{used: number, quota: number, percentage: number}>}
     */
    async getStorageUsage() {
        throw new Error('getStorageUsage method must be implemented');
    }

    /**
     * 清理存储空间
     * @returns {Promise<number>} 释放的字节数
     */
    async cleanup() {
        throw new Error('cleanup method must be implemented');
    }

    /**
     * 关闭存储连接
     * @returns {Promise<void>}
     */
    async close() {
        throw new Error('close method must be implemented');
    }
}

export default ClientStorage;
