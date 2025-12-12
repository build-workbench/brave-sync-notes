import ClientStorage from './ClientStorage';

/**
 * IndexedDB 存储实现
 * 使用 IndexedDB 提供可靠的客户端存储
 */
class IndexedDBStorage extends ClientStorage {
    constructor(options = {}) {
        super();

        this.dbName = options.dbName || 'NoteSyncDB';
        this.version = options.version || 1;
        this.db = null;
        this.isInitialized = false;

        // 存储配置
        this.maxHistoryPerNote = options.maxHistoryPerNote || 100;
        this.quotaWarningThreshold = options.quotaWarningThreshold || 0.9; // 90%
    }

    /**
     * 初始化 IndexedDB
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized && this.db) {
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(new Error(`Failed to open IndexedDB: ${request.error}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建 notebooks 存储
                if (!db.objectStoreNames.contains('notebooks')) {
                    const notebooksStore = db.createObjectStore('notebooks', { keyPath: 'id' });
                    notebooksStore.createIndex('createdAt', 'createdAt', { unique: false });
                    notebooksStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // 创建 notes 存储
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('notebookId', 'notebookId', { unique: false });
                    notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    notesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }

                // 创建 history 存储
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                    historyStore.createIndex('noteId', 'noteId', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('noteId_timestamp', ['noteId', 'timestamp'], { unique: false });
                }

                // 创建 pendingOps 存储
                if (!db.objectStoreNames.contains('pendingOps')) {
                    const opsStore = db.createObjectStore('pendingOps', { keyPath: 'id' });
                    opsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    opsStore.createIndex('notebookId', 'notebookId', { unique: false });
                }

                console.log('IndexedDB schema created/upgraded');
            };
        });
    }

    /**
     * 检查 IndexedDB 是否可用
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            if (!window.indexedDB) {
                return false;
            }

            // 尝试打开一个测试数据库
            const testDB = await new Promise((resolve, reject) => {
                const request = indexedDB.open('__test__');
                request.onsuccess = () => {
                    request.result.close();
                    indexedDB.deleteDatabase('__test__');
                    resolve(true);
                };
                request.onerror = () => reject(false);
            });

            return testDB;
        } catch (error) {
            console.error('IndexedDB availability check failed:', error);
            return false;
        }
    }

    /**
     * 确保数据库已初始化
     * @private
     */
    _ensureInitialized() {
        if (!this.isInitialized || !this.db) {
            throw new Error('IndexedDB not initialized. Call initialize() first.');
        }
    }

    /**
     * 执行事务操作
     * @private
     */
    async _transaction(storeName, mode, operation) {
        this._ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);

                const request = operation(store);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ========== 笔记本操作 ==========

    async saveNotebook(notebook) {
        if (!notebook.id || !notebook.name) {
            throw new Error('Invalid notebook data: id and name are required');
        }

        const now = Date.now();
        const notebookData = {
            ...notebook,
            updatedAt: now,
            createdAt: notebook.createdAt || now
        };

        await this._transaction('notebooks', 'readwrite', (store) => {
            return store.put(notebookData);
        });

        console.log(`Saved notebook: ${notebook.id}`);
    }

    async getNotebook(id) {
        return await this._transaction('notebooks', 'readonly', (store) => {
            return store.get(id);
        });
    }

    async listNotebooks() {
        return await this._transaction('notebooks', 'readonly', (store) => {
            return store.getAll();
        });
    }

    async deleteNotebook(id) {
        this._ensureInitialized();

        // 删除笔记本及其所有关联数据
        const transaction = this.db.transaction(
            ['notebooks', 'notes', 'history', 'pendingOps'],
            'readwrite'
        );

        // 删除笔记本
        transaction.objectStore('notebooks').delete(id);

        // 删除所有关联的笔记
        const notesStore = transaction.objectStore('notes');
        const notesIndex = notesStore.index('notebookId');
        const notesRequest = notesIndex.getAllKeys(id);

        return new Promise((resolve, reject) => {
            notesRequest.onsuccess = () => {
                const noteIds = notesRequest.result;

                // 删除每个笔记
                noteIds.forEach(noteId => {
                    notesStore.delete(noteId);

                    // 删除笔记的历史记录
                    const historyStore = transaction.objectStore('history');
                    const historyIndex = historyStore.index('noteId');
                    const historyRequest = historyIndex.getAllKeys(noteId);

                    historyRequest.onsuccess = () => {
                        historyRequest.result.forEach(historyId => {
                            historyStore.delete(historyId);
                        });
                    };
                });

                // 删除相关的待处理操作
                const opsStore = transaction.objectStore('pendingOps');
                const opsIndex = opsStore.index('notebookId');
                const opsRequest = opsIndex.getAllKeys(id);

                opsRequest.onsuccess = () => {
                    opsRequest.result.forEach(opId => {
                        opsStore.delete(opId);
                    });
                };
            };

            transaction.oncomplete = () => {
                console.log(`Deleted notebook and all associated data: ${id}`);
                resolve();
            };

            transaction.onerror = () => reject(transaction.error);
        });
    }

    // ========== 笔记操作 ==========

    async saveNote(notebookId, note) {
        if (!note.id || !notebookId) {
            throw new Error('Invalid note data: id and notebookId are required');
        }

        const now = Date.now();
        const noteData = {
            ...note,
            notebookId,
            updatedAt: now,
            createdAt: note.createdAt || now,
            version: (note.version || 0) + 1,
            tags: note.tags || []
        };

        await this._transaction('notes', 'readwrite', (store) => {
            return store.put(noteData);
        });

        console.log(`Saved note: ${note.id} in notebook: ${notebookId}`);
    }

    async getNote(notebookId, noteId) {
        const note = await this._transaction('notes', 'readonly', (store) => {
            return store.get(noteId);
        });

        // 验证笔记属于指定的笔记本
        if (note && note.notebookId !== notebookId) {
            return null;
        }

        return note;
    }

    async listNotes(notebookId) {
        this._ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const index = store.index('notebookId');
            const request = index.getAll(notebookId);

            request.onsuccess = () => {
                const notes = request.result || [];
                // 按更新时间降序排序
                notes.sort((a, b) => b.updatedAt - a.updatedAt);
                resolve(notes);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteNote(notebookId, noteId) {
        this._ensureInitialized();

        // 验证笔记属于指定的笔记本
        const note = await this.getNote(notebookId, noteId);
        if (!note) {
            throw new Error(`Note ${noteId} not found in notebook ${notebookId}`);
        }

        const transaction = this.db.transaction(['notes', 'history'], 'readwrite');

        // 删除笔记
        transaction.objectStore('notes').delete(noteId);

        // 删除历史记录
        const historyStore = transaction.objectStore('history');
        const historyIndex = historyStore.index('noteId');
        const historyRequest = historyIndex.getAllKeys(noteId);

        return new Promise((resolve, reject) => {
            historyRequest.onsuccess = () => {
                historyRequest.result.forEach(historyId => {
                    historyStore.delete(historyId);
                });
            };

            transaction.oncomplete = () => {
                console.log(`Deleted note and history: ${noteId}`);
                resolve();
            };

            transaction.onerror = () => reject(transaction.error);
        });
    }

    // ========== 历史记录操作 ==========

    async saveHistory(noteId, entry) {
        if (!entry.id || !noteId) {
            throw new Error('Invalid history entry: id and noteId are required');
        }

        const historyData = {
            ...entry,
            noteId,
            timestamp: entry.timestamp || Date.now()
        };

        await this._transaction('history', 'readwrite', (store) => {
            return store.put(historyData);
        });

        // 自动清理旧历史记录
        await this.cleanupHistory(noteId, this.maxHistoryPerNote);
    }

    async getHistory(noteId, limit = 50) {
        this._ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readonly');
            const store = transaction.objectStore('history');
            const index = store.index('noteId_timestamp');

            // 使用游标按时间戳降序获取
            const range = IDBKeyRange.bound([noteId, 0], [noteId, Date.now()]);
            const request = index.openCursor(range, 'prev');

            const results = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async cleanupHistory(noteId, keepCount) {
        this._ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readwrite');
            const store = transaction.objectStore('history');
            const index = store.index('noteId_timestamp');

            const range = IDBKeyRange.bound([noteId, 0], [noteId, Date.now()]);
            const request = index.openCursor(range, 'prev');

            let count = 0;
            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    count++;
                    if (count > keepCount) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`Cleaned up ${deletedCount} old history entries for note: ${noteId}`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ========== 离线队列操作 ==========

    async enqueueOperation(op) {
        if (!op.id) {
            throw new Error('Invalid operation: id is required');
        }

        const opData = {
            ...op,
            timestamp: op.timestamp || Date.now(),
            retries: op.retries || 0
        };

        await this._transaction('pendingOps', 'readwrite', (store) => {
            return store.put(opData);
        });

        console.log(`Enqueued operation: ${op.id}`);
    }

    async dequeueOperations() {
        const ops = await this._transaction('pendingOps', 'readonly', (store) => {
            return store.getAll();
        });

        // 按时间戳排序
        ops.sort((a, b) => a.timestamp - b.timestamp);
        return ops;
    }

    async clearQueue() {
        await this._transaction('pendingOps', 'readwrite', (store) => {
            return store.clear();
        });

        console.log('Cleared pending operations queue');
    }

    async removeOperation(operationId) {
        await this._transaction('pendingOps', 'readwrite', (store) => {
            return store.delete(operationId);
        });

        console.log(`Removed operation: ${operationId}`);
    }

    // ========== 存储管理 ==========

    async getStorageUsage() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return {
                used: 0,
                quota: 0,
                percentage: 0
            };
        }

        try {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentage = quota > 0 ? (used / quota) : 0;

            // 检查是否接近配额限制
            if (percentage >= this.quotaWarningThreshold) {
                console.warn(`Storage usage is at ${(percentage * 100).toFixed(1)}%`);
            }

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
        const notes = await this._transaction('notes', 'readonly', (store) => {
            return store.getAll();
        });

        for (const note of notes) {
            const deleted = await this.cleanupHistory(note.id, this.maxHistoryPerNote);
            totalFreed += deleted;
        }

        console.log(`Cleanup freed ${totalFreed} history entries`);
        return totalFreed;
    }

    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('IndexedDB connection closed');
        }
    }
}

export default IndexedDBStorage;
