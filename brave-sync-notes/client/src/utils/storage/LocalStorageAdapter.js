import ClientStorage from './ClientStorage';

/**
 * LocalStorage 适配器
 * 当 IndexedDB 不可用时作为降级方案
 */
class LocalStorageAdapter extends ClientStorage {
    constructor(options = {}) {
        super();

        this.prefix = options.prefix || 'notesync_';
        this.maxHistoryPerNote = options.maxHistoryPerNote || 50;
        this.isInitialized = false;
    }

    /**
     * 生成存储键
     * @private
     */
    _key(type, ...parts) {
        return `${this.prefix}${type}_${parts.join('_')}`;
    }

    /**
     * 初始化 LocalStorage
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // 测试 LocalStorage 是否可用
            const testKey = this._key('test', 'init');
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            this.isInitialized = true;
            console.log('LocalStorage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize LocalStorage:', error);
            throw new Error('LocalStorage is not available');
        }
    }

    /**
     * 检查 LocalStorage 是否可用
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 确保已初始化
     * @private
     */
    _ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('LocalStorage not initialized. Call initialize() first.');
        }
    }

    /**
     * 获取 JSON 数据
     * @private
     */
    _getJSON(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Failed to parse JSON for key ${key}:`, error);
            return null;
        }
    }

    /**
     * 设置 JSON 数据
     * @private
     */
    _setJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // 可能是配额超限
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded');
                throw new Error('Storage quota exceeded. Please free up space.');
            }
            throw error;
        }
    }

    /**
     * 获取所有匹配前缀的键
     * @private
     */
    _getAllKeys(prefix) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    // ========== 笔记本操作 ==========

    async saveNotebook(notebook) {
        this._ensureInitialized();

        if (!notebook.id || !notebook.name) {
            throw new Error('Invalid notebook data: id and name are required');
        }

        const now = Date.now();
        const notebookData = {
            ...notebook,
            updatedAt: now,
            createdAt: notebook.createdAt || now
        };

        const key = this._key('notebook', notebook.id);
        this._setJSON(key, notebookData);

        // 更新笔记本索引
        const indexKey = this._key('notebooks', 'index');
        const index = this._getJSON(indexKey) || [];
        if (!index.includes(notebook.id)) {
            index.push(notebook.id);
            this._setJSON(indexKey, index);
        }

        console.log(`Saved notebook to LocalStorage: ${notebook.id}`);
    }

    async getNotebook(id) {
        this._ensureInitialized();
        const key = this._key('notebook', id);
        return this._getJSON(key);
    }

    async listNotebooks() {
        this._ensureInitialized();

        const indexKey = this._key('notebooks', 'index');
        const index = this._getJSON(indexKey) || [];

        const notebooks = [];
        for (const id of index) {
            const notebook = await this.getNotebook(id);
            if (notebook) {
                notebooks.push(notebook);
            }
        }

        return notebooks;
    }

    async deleteNotebook(id) {
        this._ensureInitialized();

        // 删除笔记本
        const notebookKey = this._key('notebook', id);
        localStorage.removeItem(notebookKey);

        // 从索引中移除
        const indexKey = this._key('notebooks', 'index');
        const index = this._getJSON(indexKey) || [];
        const newIndex = index.filter(nid => nid !== id);
        this._setJSON(indexKey, newIndex);

        // 删除所有关联的笔记
        const notes = await this.listNotes(id);
        for (const note of notes) {
            await this.deleteNote(id, note.id);
        }

        // 删除相关的待处理操作
        const opsPrefix = this._key('op');
        const opKeys = this._getAllKeys(opsPrefix);
        for (const opKey of opKeys) {
            const op = this._getJSON(opKey);
            if (op && op.notebookId === id) {
                localStorage.removeItem(opKey);
            }
        }

        console.log(`Deleted notebook from LocalStorage: ${id}`);
    }

    // ========== 笔记操作 ==========

    async saveNote(notebookId, note) {
        this._ensureInitialized();

        if (!note.id || !notebookId) {
            throw new Error('Invalid note data: id and notebookId are required');
        }

        // Validate that note has content or title (at least one meaningful field)
        if (note.content === undefined && note.title === undefined) {
            throw new Error('Invalid note data: content or title is required');
        }

        const now = Date.now();

        // Get existing note to preserve version
        const existing = await this.getNote(notebookId, note.id);

        const noteData = {
            ...note,
            notebookId,
            updatedAt: now,
            createdAt: existing?.createdAt || note.createdAt || now,
            version: existing ? existing.version + 1 : (note.version || 1),
            tags: note.tags || []
        };

        const key = this._key('note', notebookId, note.id);
        this._setJSON(key, noteData);

        // 更新笔记索引
        const indexKey = this._key('notes', 'index', notebookId);
        const index = this._getJSON(indexKey) || [];
        if (!index.includes(note.id)) {
            index.push(note.id);
            this._setJSON(indexKey, index);
        }

        console.log(`Saved note to LocalStorage: ${note.id}`);
    }

    async getNote(notebookId, noteId) {
        this._ensureInitialized();
        const key = this._key('note', notebookId, noteId);
        return this._getJSON(key);
    }

    async listNotes(notebookId) {
        this._ensureInitialized();

        const indexKey = this._key('notes', 'index', notebookId);
        const index = this._getJSON(indexKey) || [];

        const notes = [];
        for (const noteId of index) {
            const note = await this.getNote(notebookId, noteId);
            if (note) {
                notes.push(note);
            }
        }

        // 按更新时间降序排序
        notes.sort((a, b) => b.updatedAt - a.updatedAt);
        return notes;
    }

    async deleteNote(notebookId, noteId) {
        this._ensureInitialized();

        // 删除笔记
        const noteKey = this._key('note', notebookId, noteId);
        localStorage.removeItem(noteKey);

        // 从索引中移除
        const indexKey = this._key('notes', 'index', notebookId);
        const index = this._getJSON(indexKey) || [];
        const newIndex = index.filter(nid => nid !== noteId);
        this._setJSON(indexKey, newIndex);

        // 删除历史记录
        const historyPrefix = this._key('history', noteId);
        const historyKeys = this._getAllKeys(historyPrefix);
        historyKeys.forEach(key => localStorage.removeItem(key));

        // 删除历史索引
        const historyIndexKey = this._key('history', 'index', noteId);
        localStorage.removeItem(historyIndexKey);

        console.log(`Deleted note from LocalStorage: ${noteId}`);
    }

    // ========== 历史记录操作 ==========

    async saveHistory(noteId, entry) {
        this._ensureInitialized();

        if (!entry.id || !noteId) {
            throw new Error('Invalid history entry: id and noteId are required');
        }

        const historyData = {
            ...entry,
            noteId,
            timestamp: entry.timestamp || Date.now()
        };

        const key = this._key('history', noteId, entry.id);
        this._setJSON(key, historyData);

        // 更新历史索引
        const indexKey = this._key('history', 'index', noteId);
        const index = this._getJSON(indexKey) || [];
        if (!index.includes(entry.id)) {
            index.unshift(entry.id); // 添加到开头
            this._setJSON(indexKey, index);
        }

        // 自动清理
        await this.cleanupHistory(noteId, this.maxHistoryPerNote);
    }

    async getHistory(noteId, limit = 50) {
        this._ensureInitialized();

        const indexKey = this._key('history', 'index', noteId);
        const index = this._getJSON(indexKey) || [];

        const history = [];
        const limitedIndex = index.slice(0, limit);

        for (const entryId of limitedIndex) {
            const key = this._key('history', noteId, entryId);
            const entry = this._getJSON(key);
            if (entry) {
                history.push(entry);
            }
        }

        return history;
    }

    async cleanupHistory(noteId, keepCount) {
        this._ensureInitialized();

        const indexKey = this._key('history', 'index', noteId);
        const index = this._getJSON(indexKey) || [];

        if (index.length <= keepCount) {
            return 0;
        }

        // 删除超出限制的历史记录
        const toDelete = index.slice(keepCount);
        toDelete.forEach(entryId => {
            const key = this._key('history', noteId, entryId);
            localStorage.removeItem(key);
        });

        // 更新索引
        const newIndex = index.slice(0, keepCount);
        this._setJSON(indexKey, newIndex);

        console.log(`Cleaned up ${toDelete.length} old history entries`);
        return toDelete.length;
    }

    // ========== 离线队列操作 ==========

    async enqueueOperation(op) {
        this._ensureInitialized();

        if (!op.id) {
            throw new Error('Invalid operation: id is required');
        }

        const opData = {
            ...op,
            timestamp: op.timestamp || Date.now(),
            retries: op.retries || 0
        };

        const key = this._key('op', op.id);
        this._setJSON(key, opData);

        // 更新操作索引
        const indexKey = this._key('ops', 'index');
        const index = this._getJSON(indexKey) || [];
        if (!index.includes(op.id)) {
            index.push(op.id);
            this._setJSON(indexKey, index);
        }

        console.log(`Enqueued operation to LocalStorage: ${op.id}`);
    }

    async dequeueOperations() {
        this._ensureInitialized();

        const indexKey = this._key('ops', 'index');
        const index = this._getJSON(indexKey) || [];

        const ops = [];
        for (const opId of index) {
            const key = this._key('op', opId);
            const op = this._getJSON(key);
            if (op) {
                ops.push(op);
            }
        }

        // 按时间戳排序
        ops.sort((a, b) => a.timestamp - b.timestamp);
        return ops;
    }

    async clearQueue() {
        this._ensureInitialized();

        const indexKey = this._key('ops', 'index');
        const index = this._getJSON(indexKey) || [];

        // 删除所有操作
        index.forEach(opId => {
            const key = this._key('op', opId);
            localStorage.removeItem(key);
        });

        // 清空索引
        localStorage.removeItem(indexKey);

        console.log('Cleared pending operations queue from LocalStorage');
    }

    async removeOperation(operationId) {
        this._ensureInitialized();

        const key = this._key('op', operationId);
        localStorage.removeItem(key);

        // 从索引中移除
        const indexKey = this._key('ops', 'index');
        const index = this._getJSON(indexKey) || [];
        const newIndex = index.filter(id => id !== operationId);
        this._setJSON(indexKey, newIndex);

        console.log(`Removed operation from LocalStorage: ${operationId}`);
    }

    // ========== 存储管理 ==========

    async getStorageUsage() {
        try {
            // 估算 LocalStorage 使用量
            let used = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    used += key.length + (value ? value.length : 0);
                }
            }

            // LocalStorage 通常限制为 5-10MB
            const quota = 5 * 1024 * 1024; // 假设 5MB
            const percentage = used / quota;

            return {
                used,
                quota,
                percentage
            };
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            return {
                used: 0,
                quota: 0,
                percentage: 0
            };
        }
    }

    async cleanup() {
        this._ensureInitialized();

        let totalFreed = 0;

        // 清理所有笔记的旧历史记录
        const notebooks = await this.listNotebooks();
        for (const notebook of notebooks) {
            const notes = await this.listNotes(notebook.id);
            for (const note of notes) {
                const deleted = await this.cleanupHistory(note.id, this.maxHistoryPerNote);
                totalFreed += deleted;
            }
        }

        console.log(`Cleanup freed ${totalFreed} history entries from LocalStorage`);
        return totalFreed;
    }

    async close() {
        // LocalStorage 不需要关闭连接
        this.isInitialized = false;
        console.log('LocalStorage adapter closed');
    }
}

export default LocalStorageAdapter;
