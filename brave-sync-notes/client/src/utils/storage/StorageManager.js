import IndexedDBStorage from './IndexedDBStorage';
import LocalStorageAdapter from './LocalStorageAdapter';

/**
 * 存储管理器
 * 自动在 IndexedDB 和 LocalStorage 之间切换
 */
class StorageManager {
    constructor(options = {}) {
        this.options = options;
        this.storage = null;
        this.storageType = null;
        this.isInitialized = false;
    }

    /**
     * 初始化存储
     * 优先使用 IndexedDB，如果不可用则降级到 LocalStorage
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized && this.storage) {
            return;
        }

        try {
            // 尝试使用 IndexedDB
            const indexedDB = new IndexedDBStorage(this.options);
            const isIndexedDBAvailable = await indexedDB.isAvailable();

            if (isIndexedDBAvailable) {
                await indexedDB.initialize();
                this.storage = indexedDB;
                this.storageType = 'IndexedDB';
                console.log('✅ Using IndexedDB for storage');
            } else {
                throw new Error('IndexedDB not available');
            }
        } catch (error) {
            console.warn('IndexedDB initialization failed, falling back to LocalStorage:', error);

            try {
                // 降级到 LocalStorage
                const localStorage = new LocalStorageAdapter(this.options);
                const isLocalStorageAvailable = await localStorage.isAvailable();

                if (isLocalStorageAvailable) {
                    await localStorage.initialize();
                    this.storage = localStorage;
                    this.storageType = 'LocalStorage';
                    console.log('⚠️  Using LocalStorage as fallback');
                } else {
                    throw new Error('LocalStorage not available');
                }
            } catch (fallbackError) {
                console.error('Both IndexedDB and LocalStorage failed:', fallbackError);
                throw new Error('No storage mechanism available');
            }
        }

        this.isInitialized = true;
    }

    /**
     * 获取当前使用的存储类型
     * @returns {string|null}
     */
    getStorageType() {
        return this.storageType;
    }

    /**
     * 确保存储已初始化
     * @private
     */
    _ensureInitialized() {
        if (!this.isInitialized || !this.storage) {
            throw new Error('Storage not initialized. Call initialize() first.');
        }
    }

    // ========== 代理所有存储操作到当前存储实现 ==========

    async saveNotebook(notebook) {
        this._ensureInitialized();
        return this.storage.saveNotebook(notebook);
    }

    async getNotebook(id) {
        this._ensureInitialized();
        return this.storage.getNotebook(id);
    }

    async listNotebooks() {
        this._ensureInitialized();
        return this.storage.listNotebooks();
    }

    async deleteNotebook(id) {
        this._ensureInitialized();
        return this.storage.deleteNotebook(id);
    }

    async saveNote(notebookId, note) {
        this._ensureInitialized();
        return this.storage.saveNote(notebookId, note);
    }

    async getNote(notebookId, noteId) {
        this._ensureInitialized();
        return this.storage.getNote(notebookId, noteId);
    }

    async listNotes(notebookId) {
        this._ensureInitialized();
        return this.storage.listNotes(notebookId);
    }

    async deleteNote(notebookId, noteId) {
        this._ensureInitialized();
        return this.storage.deleteNote(notebookId, noteId);
    }

    async saveHistory(noteId, entry) {
        this._ensureInitialized();
        return this.storage.saveHistory(noteId, entry);
    }

    async getHistory(noteId, limit) {
        this._ensureInitialized();
        return this.storage.getHistory(noteId, limit);
    }

    async cleanupHistory(noteId, keepCount) {
        this._ensureInitialized();
        return this.storage.cleanupHistory(noteId, keepCount);
    }

    async enqueueOperation(op) {
        this._ensureInitialized();
        return this.storage.enqueueOperation(op);
    }

    async dequeueOperations() {
        this._ensureInitialized();
        return this.storage.dequeueOperations();
    }

    async clearQueue() {
        this._ensureInitialized();
        return this.storage.clearQueue();
    }

    async removeOperation(operationId) {
        this._ensureInitialized();
        return this.storage.removeOperation(operationId);
    }

    async getStorageUsage() {
        this._ensureInitialized();
        return this.storage.getStorageUsage();
    }

    async cleanup() {
        this._ensureInitialized();
        return this.storage.cleanup();
    }

    async close() {
        if (this.storage) {
            await this.storage.close();
            this.storage = null;
            this.storageType = null;
            this.isInitialized = false;
        }
    }

    /**
     * 迁移数据从一个存储到另一个
     * @param {ClientStorage} targetStorage - 目标存储
     * @returns {Promise<{notebooks: number, notes: number, history: number, operations: number}>}
     */
    async migrateData(targetStorage) {
        this._ensureInitialized();

        if (!targetStorage) {
            throw new Error('Target storage is required');
        }

        await targetStorage.initialize();

        const stats = {
            notebooks: 0,
            notes: 0,
            history: 0,
            operations: 0
        };

        try {
            // 迁移笔记本
            const notebooks = await this.listNotebooks();
            for (const notebook of notebooks) {
                await targetStorage.saveNotebook(notebook);
                stats.notebooks++;

                // 迁移笔记本中的笔记
                const notes = await this.listNotes(notebook.id);
                for (const note of notes) {
                    await targetStorage.saveNote(notebook.id, note);
                    stats.notes++;

                    // 迁移历史记录
                    const history = await this.getHistory(note.id);
                    for (const entry of history) {
                        await targetStorage.saveHistory(note.id, entry);
                        stats.history++;
                    }
                }
            }

            // 迁移待处理操作
            const operations = await this.dequeueOperations();
            for (const op of operations) {
                await targetStorage.enqueueOperation(op);
                stats.operations++;
            }

            console.log('Data migration completed:', stats);
            return stats;
        } catch (error) {
            console.error('Data migration failed:', error);
            throw error;
        }
    }
}

// 创建单例实例
let storageManagerInstance = null;

/**
 * 获取存储管理器单例
 * @param {Object} options - 配置选项
 * @returns {StorageManager}
 */
export function getStorageManager(options = {}) {
    if (!storageManagerInstance) {
        storageManagerInstance = new StorageManager(options);
    }
    return storageManagerInstance;
}

/**
 * 重置存储管理器单例（主要用于测试）
 */
export function resetStorageManager() {
    if (storageManagerInstance) {
        storageManagerInstance.close();
        storageManagerInstance = null;
    }
}

export default StorageManager;
