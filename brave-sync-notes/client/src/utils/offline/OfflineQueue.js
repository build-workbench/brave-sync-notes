/**
 * 离线操作队列
 * 管理离线时的编辑操作，网络恢复后自动同步
 */
class OfflineQueue {
    constructor(storage) {
        this.storage = storage;
        this.isProcessing = false;
        this.maxRetries = 3;
        this.onOperationProcessed = null;
        this.onQueueEmpty = null;
        this.onError = null;
    }

    /**
     * 生成唯一操作ID
     */
    generateId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 添加操作到队列
     * @param {Object} operation - 操作对象
     * @param {string} operation.type - 操作类型: 'create' | 'update' | 'delete'
     * @param {string} operation.noteId - 笔记ID
     * @param {string} operation.notebookId - 笔记本ID
     * @param {any} operation.data - 操作数据
     */
    async enqueue(operation) {
        const op = {
            id: operation.id || this.generateId(),
            type: operation.type,
            noteId: operation.noteId,
            notebookId: operation.notebookId,
            data: operation.data,
            timestamp: Date.now(),
            retries: 0,
        };

        await this.storage.enqueueOperation(op);
        console.log(`Enqueued offline operation: ${op.id} (${op.type})`);
        return op.id;
    }

    /**
     * 获取队列中的所有操作
     */
    async getAll() {
        return await this.storage.dequeueOperations();
    }

    /**
     * 获取队列大小
     */
    async getQueueSize() {
        const ops = await this.getAll();
        return ops.length;
    }

    /**
     * 处理队列中的操作
     * @param {Function} processor - 处理函数，接收操作并返回 Promise<boolean>
     */
    async processQueue(processor) {
        if (this.isProcessing) {
            console.log('Queue is already being processed');
            return { processed: 0, failed: 0 };
        }

        this.isProcessing = true;
        const results = { processed: 0, failed: 0 };

        try {
            const operations = await this.getAll();

            if (operations.length === 0) {
                console.log('No operations in queue');
                if (this.onQueueEmpty) {
                    this.onQueueEmpty();
                }
                return results;
            }

            console.log(`Processing ${operations.length} offline operations`);

            for (const op of operations) {
                try {
                    const success = await processor(op);

                    if (success) {
                        await this.storage.removeOperation(op.id);
                        results.processed++;

                        if (this.onOperationProcessed) {
                            this.onOperationProcessed(op, true);
                        }
                    } else {
                        // 增加重试次数
                        op.retries = (op.retries || 0) + 1;

                        if (op.retries >= this.maxRetries) {
                            // 超过最大重试次数，移除操作
                            await this.storage.removeOperation(op.id);
                            results.failed++;
                            console.error(`Operation ${op.id} failed after ${this.maxRetries} retries`);

                            if (this.onError) {
                                this.onError(op, new Error('Max retries exceeded'));
                            }
                        } else {
                            // 更新重试次数
                            await this.storage.enqueueOperation(op);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing operation ${op.id}:`, error);
                    results.failed++;

                    if (this.onError) {
                        this.onError(op, error);
                    }
                }
            }

            if (results.processed > 0 && this.onQueueEmpty) {
                const remaining = await this.getQueueSize();
                if (remaining === 0) {
                    this.onQueueEmpty();
                }
            }

            return results;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 清空队列
     */
    async clearQueue() {
        await this.storage.clearQueue();
        console.log('Offline queue cleared');
    }

    /**
     * 移除特定操作
     */
    async removeOperation(operationId) {
        await this.storage.removeOperation(operationId);
    }

    /**
     * 获取队列状态
     */
    async getStatus() {
        const operations = await this.getAll();
        return {
            size: operations.length,
            isProcessing: this.isProcessing,
            operations: operations.map(op => ({
                id: op.id,
                type: op.type,
                noteId: op.noteId,
                timestamp: op.timestamp,
                retries: op.retries,
            })),
        };
    }

    /**
     * 设置操作处理回调
     */
    setOnOperationProcessed(callback) {
        this.onOperationProcessed = callback;
    }

    /**
     * 设置队列清空回调
     */
    setOnQueueEmpty(callback) {
        this.onQueueEmpty = callback;
    }

    /**
     * 设置错误回调
     */
    setOnError(callback) {
        this.onError = callback;
    }
}

export default OfflineQueue;
