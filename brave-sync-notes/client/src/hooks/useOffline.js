import { useState, useRef, useCallback, useEffect } from 'react';
import { OfflineQueue } from '../utils/offline';
import { getStorageManager } from '../utils/storage';

/**
 * 离线状态管理 Hook
 * 监控网络状态，管理离线队列
 */
export const useOffline = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueSize, setQueueSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const queueRef = useRef(null);
    const storageRef = useRef(null);

    /**
     * 初始化离线队列
     */
    const initializeQueue = useCallback(async () => {
        if (queueRef.current) return;

        try {
            const storage = getStorageManager();
            await storage.initialize();
            storageRef.current = storage;

            queueRef.current = new OfflineQueue(storage);

            // 更新队列大小
            const size = await queueRef.current.getQueueSize();
            setQueueSize(size);

            console.log('Offline queue initialized');
        } catch (error) {
            console.error('Failed to initialize offline queue:', error);
        }
    }, []);

    /**
     * 添加操作到离线队列
     */
    const enqueueOperation = useCallback(async (operation) => {
        if (!queueRef.current) {
            await initializeQueue();
        }

        const id = await queueRef.current.enqueue(operation);
        const size = await queueRef.current.getQueueSize();
        setQueueSize(size);

        return id;
    }, [initializeQueue]);

    /**
     * 处理离线队列
     * @param {Function} processor - 处理函数
     */
    const processQueue = useCallback(async (processor) => {
        if (!queueRef.current || isProcessing) return { processed: 0, failed: 0 };

        setIsProcessing(true);

        try {
            const results = await queueRef.current.processQueue(processor);
            const size = await queueRef.current.getQueueSize();
            setQueueSize(size);

            if (results.processed > 0) {
                setLastSyncTime(Date.now());
            }

            return results;
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing]);

    /**
     * 清空离线队列
     */
    const clearQueue = useCallback(async () => {
        if (!queueRef.current) return;

        await queueRef.current.clearQueue();
        setQueueSize(0);
    }, []);

    /**
     * 获取队列状态
     */
    const getQueueStatus = useCallback(async () => {
        if (!queueRef.current) {
            return { size: 0, isProcessing: false, operations: [] };
        }

        return await queueRef.current.getStatus();
    }, []);

    /**
     * 获取所有待处理操作
     */
    const getPendingOperations = useCallback(async () => {
        if (!queueRef.current) return [];
        return await queueRef.current.getAll();
    }, []);

    // 监听网络状态变化
    useEffect(() => {
        const handleOnline = () => {
            console.log('Network online');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('Network offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 初始化队列
    useEffect(() => {
        initializeQueue();
    }, [initializeQueue]);

    // 定期更新队列大小
    useEffect(() => {
        const updateQueueSize = async () => {
            if (queueRef.current) {
                const size = await queueRef.current.getQueueSize();
                setQueueSize(size);
            }
        };

        const interval = setInterval(updateQueueSize, 5000);
        return () => clearInterval(interval);
    }, []);

    return {
        // 状态
        isOnline,
        queueSize,
        isProcessing,
        lastSyncTime,

        // 操作
        enqueueOperation,
        processQueue,
        clearQueue,
        getQueueStatus,
        getPendingOperations,
    };
};

export default useOffline;
