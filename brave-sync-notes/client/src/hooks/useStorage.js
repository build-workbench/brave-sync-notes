import { useState, useRef, useCallback, useEffect } from 'react';
import { getStorageManager } from '../utils/storage';

/**
 * 存储管理 Hook
 * 提供统一的存储接口，自动处理 IndexedDB/LocalStorage 切换
 */
export const useStorage = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [storageType, setStorageType] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const storageRef = useRef(null);

    /**
     * 初始化存储
     */
    const initialize = useCallback(async () => {
        if (storageRef.current && isInitialized) {
            return true;
        }

        setIsLoading(true);
        setError(null);

        try {
            const storage = getStorageManager();
            await storage.initialize();

            storageRef.current = storage;
            setStorageType(storage.getStorageType());
            setIsInitialized(true);
            setIsLoading(false);

            console.log(`Storage initialized: ${storage.getStorageType()}`);
            return true;
        } catch (err) {
            console.error('Failed to initialize storage:', err);
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, [isInitialized]);

    /**
     * 确保存储已初始化
     */
    const ensureInitialized = useCallback(async () => {
        if (!storageRef.current || !isInitialized) {
            return await initialize();
        }
        return true;
    }, [initialize, isInitialized]);

    // ========== 笔记本操作 ==========

    const saveNotebook = useCallback(async (notebook) => {
        await ensureInitialized();
        return storageRef.current.saveNotebook(notebook);
    }, [ensureInitialized]);

    const getNotebook = useCallback(async (id) => {
        await ensureInitialized();
        return storageRef.current.getNotebook(id);
    }, [ensureInitialized]);

    const listNotebooks = useCallback(async () => {
        await ensureInitialized();
        return storageRef.current.listNotebooks();
    }, [ensureInitialized]);

    const deleteNotebook = useCallback(async (id) => {
        await ensureInitialized();
        return storageRef.current.deleteNotebook(id);
    }, [ensureInitialized]);

    // ========== 笔记操作 ==========

    const saveNote = useCallback(async (notebookId, note) => {
        await ensureInitialized();
        return storageRef.current.saveNote(notebookId, note);
    }, [ensureInitialized]);

    const getNote = useCallback(async (notebookId, noteId) => {
        await ensureInitialized();
        return storageRef.current.getNote(notebookId, noteId);
    }, [ensureInitialized]);

    const getAllNotes = useCallback(async (notebookId) => {
        await ensureInitialized();
        return storageRef.current.listNotes(notebookId);
    }, [ensureInitialized]);

    const deleteNote = useCallback(async (notebookId, noteId) => {
        await ensureInitialized();
        return storageRef.current.deleteNote(notebookId, noteId);
    }, [ensureInitialized]);

    // ========== 历史记录操作 ==========

    const saveHistory = useCallback(async (noteId, entry) => {
        await ensureInitialized();
        return storageRef.current.saveHistory(noteId, entry);
    }, [ensureInitialized]);

    const getHistory = useCallback(async (noteId, limit = 50) => {
        await ensureInitialized();
        return storageRef.current.getHistory(noteId, limit);
    }, [ensureInitialized]);

    const cleanupHistory = useCallback(async (noteId, keepCount) => {
        await ensureInitialized();
        return storageRef.current.cleanupHistory(noteId, keepCount);
    }, [ensureInitialized]);

    // ========== 离线队列操作 ==========

    const enqueueOperation = useCallback(async (op) => {
        await ensureInitialized();
        return storageRef.current.enqueueOperation(op);
    }, [ensureInitialized]);

    const dequeueOperations = useCallback(async () => {
        await ensureInitialized();
        return storageRef.current.dequeueOperations();
    }, [ensureInitialized]);

    const clearQueue = useCallback(async () => {
        await ensureInitialized();
        return storageRef.current.clearQueue();
    }, [ensureInitialized]);

    const removeOperation = useCallback(async (operationId) => {
        await ensureInitialized();
        return storageRef.current.removeOperation(operationId);
    }, [ensureInitialized]);

    // ========== 存储管理 ==========

    const getStorageUsage = useCallback(async () => {
        await ensureInitialized();
        return storageRef.current.getStorageUsage();
    }, [ensureInitialized]);

    const cleanup = useCallback(async () => {
        await ensureInitialized();
        return storageRef.current.cleanup();
    }, [ensureInitialized]);

    // 自动初始化
    useEffect(() => {
        initialize();
    }, [initialize]);

    return {
        // 状态
        isInitialized,
        storageType,
        error,
        isLoading,

        // 初始化
        initialize,

        // 笔记本操作
        saveNotebook,
        getNotebook,
        listNotebooks,
        deleteNotebook,

        // 笔记操作
        saveNote,
        getNote,
        getAllNotes,
        deleteNote,

        // 历史记录操作
        saveHistory,
        getHistory,
        cleanupHistory,

        // 离线队列操作
        enqueueOperation,
        dequeueOperations,
        clearQueue,
        removeOperation,

        // 存储管理
        getStorageUsage,
        cleanup,
    };
};

export default useStorage;
