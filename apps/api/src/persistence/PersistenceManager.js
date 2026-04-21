const RedisPersistence = require('./RedisPersistence');
const SQLitePersistence = require('./SQLitePersistence');

/**
 * 持久化管理器
 * 负责管理不同的存储适配器，提供故障转移和负载均衡
 */
class PersistenceManager {
    constructor(options = {}) {
        this.options = {
            primaryAdapter: options.primaryAdapter || 'redis',
            fallbackAdapter: options.fallbackAdapter || 'sqlite',
            healthCheckInterval: options.healthCheckInterval || 30000, // 30秒
            autoFailover: options.autoFailover !== false,
            ...options
        };

        this.adapters = new Map();
        this.currentAdapter = null;
        this.healthCheckTimer = null;
        this.isInitialized = false;
    }

    /**
     * 初始化持久化管理器
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // 初始化 Redis 适配器
            if (this.options.primaryAdapter === 'redis' || this.options.fallbackAdapter === 'redis') {
                const redisAdapter = new RedisPersistence(this.options.redis || {});
                this.adapters.set('redis', redisAdapter);
            }

            // 初始化 SQLite 适配器
            if (this.options.primaryAdapter === 'sqlite' || this.options.fallbackAdapter === 'sqlite') {
                const sqliteAdapter = new SQLitePersistence(this.options.sqlite || {});
                this.adapters.set('sqlite', sqliteAdapter);
            }

            // 尝试连接主适配器
            await this._switchToAdapter(this.options.primaryAdapter);

            // 启动健康检查
            if (this.options.autoFailover) {
                this._startHealthCheck();
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize persistence manager:', error);

            if (this.options.autoFailover && this.options.fallbackAdapter !== this.options.primaryAdapter) {
                try {
                    await this._switchToAdapter(this.options.fallbackAdapter);
                    this.isInitialized = true;
                } catch (fallbackError) {
                    console.error('Failed to initialize fallback adapter:', fallbackError);
                    throw new Error('All persistence adapters failed to initialize');
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * 切换到指定的适配器
     * @private
     */
    async _switchToAdapter(adapterName) {
        const adapter = this.adapters.get(adapterName);
        if (!adapter) {
            throw new Error(`Adapter ${adapterName} not found`);
        }

        try {
            await adapter.connect();
            const isHealthy = await adapter.isHealthy();

            if (!isHealthy) {
                throw new Error(`Adapter ${adapterName} is not healthy`);
            }

            this.currentAdapter = adapter;
            this.currentAdapterName = adapterName;
        } catch (error) {
            console.error(`Failed to switch to adapter ${adapterName}:`, error);
            throw error;
        }
    }

    /**
     * 启动健康检查
     * @private
     */
    _startHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(async () => {
            try {
                await this._performHealthCheck();
            } catch (error) {
                console.error('Health check error:', error);
            }
        }, this.options.healthCheckInterval);
    }

    /**
     * 执行健康检查
     * @private
     */
    async _performHealthCheck() {
        if (!this.currentAdapter) {
            return;
        }

        const isHealthy = await this.currentAdapter.isHealthy();

        if (!isHealthy) {
            console.warn(`Current adapter ${this.currentAdapterName} is unhealthy, attempting failover`);

            // 尝试故障转移
            const fallbackName = this.currentAdapterName === this.options.primaryAdapter
                ? this.options.fallbackAdapter
                : this.options.primaryAdapter;

            if (fallbackName && this.adapters.has(fallbackName)) {
                try {
                    await this._switchToAdapter(fallbackName);
                } catch (error) {
                    console.error(`Failover to ${fallbackName} failed:`, error);
                }
            }
        }
    }

    /**
     * 停止健康检查
     * @private
     */
    _stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    /**
     * 确保管理器已初始化
     * @private
     */
    _ensureInitialized() {
        if (!this.isInitialized || !this.currentAdapter) {
            throw new Error('Persistence manager not initialized');
        }
    }

    // 代理所有持久化操作到当前适配器

    /**
     * 保存同步链数据
     */
    async saveRoom(roomId, data) {
        this._ensureInitialized();
        return this.currentAdapter.saveRoom(roomId, data);
    }

    /**
     * 获取同步链数据
     */
    async getRoom(roomId) {
        this._ensureInitialized();
        return this.currentAdapter.getRoom(roomId);
    }

    /**
     * 删除过期数据
     */
    async cleanupExpired(olderThan) {
        this._ensureInitialized();
        return this.currentAdapter.cleanupExpired(olderThan);
    }

    /**
     * 保存操作日志
     */
    async appendLog(roomId, operation) {
        this._ensureInitialized();
        return this.currentAdapter.appendLog(roomId, operation);
    }

    /**
     * 获取操作日志
     */
    async getLog(roomId, since) {
        this._ensureInitialized();
        return this.currentAdapter.getLog(roomId, since);
    }

    /**
     * 检查存储连接状态
     */
    async isHealthy() {
        if (!this.isInitialized || !this.currentAdapter) {
            return false;
        }
        return this.currentAdapter.isHealthy();
    }

    /**
     * 获取存储统计信息
     */
    async getStats() {
        this._ensureInitialized();

        const currentStats = await this.currentAdapter.getStats();
        const allStats = {};

        // 收集所有适配器的统计信息
        for (const [name, adapter] of this.adapters) {
            try {
                allStats[name] = await adapter.getStats();
            } catch (error) {
                allStats[name] = { error: error.message };
            }
        }

        return {
            current: {
                adapter: this.currentAdapterName,
                ...currentStats
            },
            all: allStats,
            manager: {
                initialized: this.isInitialized,
                primaryAdapter: this.options.primaryAdapter,
                fallbackAdapter: this.options.fallbackAdapter,
                autoFailover: this.options.autoFailover
            }
        };
    }

    /**
     * 手动切换适配器
     */
    async switchAdapter(adapterName) {
        if (!this.adapters.has(adapterName)) {
            throw new Error(`Adapter ${adapterName} not available`);
        }

        await this._switchToAdapter(adapterName);
    }

    /**
     * 获取当前适配器名称
     */
    getCurrentAdapter() {
        return this.currentAdapterName;
    }

    /**
     * 获取可用的适配器列表
     */
    getAvailableAdapters() {
        return Array.from(this.adapters.keys());
    }

    /**
     * 关闭持久化管理器
     */
    async close() {
        this._stopHealthCheck();

        // 关闭所有适配器
        const closePromises = Array.from(this.adapters.values()).map(adapter =>
            adapter.close().catch(error =>
                console.error('Error closing adapter:', error)
            )
        );

        await Promise.all(closePromises);

        this.adapters.clear();
        this.currentAdapter = null;
        this.currentAdapterName = null;
        this.isInitialized = false;
    }

    /**
     * 执行数据迁移（从一个适配器迁移到另一个）
     * @param {string} fromAdapter - 源适配器名称
     * @param {string} toAdapter - 目标适配器名称
     * @param {object} options - 迁移选项
     * @param {number} options.batchSize - 批量处理大小，默认100
     * @param {function} options.onProgress - 进度回调函数
     * @returns {Promise<{migrated: number, errors: number, details: object}>}
     */
    async migrateData(fromAdapter, toAdapter, options = {}) {
        const sourceAdapter = this.adapters.get(fromAdapter);
        const targetAdapter = this.adapters.get(toAdapter);

        if (!sourceAdapter || !targetAdapter) {
            throw new Error('Source or target adapter not found');
        }

        const { batchSize = 100, onProgress } = options;
        const result = {
            migrated: 0,
            errors: 0,
            details: {
                startTime: Date.now(),
                endTime: null,
                errorDetails: []
            }
        };

        try {
            console.log(`Starting migration from ${fromAdapter} to ${toAdapter}`);

            // Step 1: Get all room IDs from source adapter
            let roomIds = [];
            if (typeof sourceAdapter.getAllRoomIds === 'function') {
                roomIds = await sourceAdapter.getAllRoomIds();
            } else {
                // Fallback: try to get room IDs from stats or iterate
                const stats = await sourceAdapter.getStats();
                if (stats.roomIds) {
                    roomIds = stats.roomIds;
                } else if (stats.roomCount) {
                    console.warn('Source adapter does not support listing room IDs. Migration may be incomplete.');
                }
            }

            console.log(`Found ${roomIds.length} rooms to migrate`);

            // Step 2: Migrate rooms in batches
            for (let i = 0; i < roomIds.length; i += batchSize) {
                const batch = roomIds.slice(i, i + batchSize);

                for (const roomId of batch) {
                    try {
                        // Get data from source
                        const roomData = await sourceAdapter.getRoom(roomId);

                        if (roomData) {
                            // Save to target
                            await targetAdapter.saveRoom(roomId, roomData);
                            result.migrated++;
                        }
                    } catch (error) {
                        result.errors++;
                        result.details.errorDetails.push({
                            roomId,
                            error: error.message
                        });
                        console.error(`Failed to migrate room ${roomId}:`, error.message);
                    }
                }

                // Report progress
                if (onProgress) {
                    onProgress({
                        total: roomIds.length,
                        processed: Math.min(i + batchSize, roomIds.length),
                        migrated: result.migrated,
                        errors: result.errors
                    });
                }
            }

            // Step 3: Migrate operation logs if supported
            if (typeof sourceAdapter.getAllLogs === 'function' && typeof targetAdapter.appendLog === 'function') {
                try {
                    const logs = await sourceAdapter.getAllLogs();
                    for (const log of logs) {
                        try {
                            await targetAdapter.appendLog(log.roomId, log.operation);
                        } catch (logError) {
                            console.error(`Failed to migrate log for room ${log.roomId}:`, logError.message);
                        }
                    }
                } catch (logError) {
                    console.warn('Log migration not supported or failed:', logError.message);
                }
            }

            result.details.endTime = Date.now();
            const duration = (result.details.endTime - result.details.startTime) / 1000;

            console.log(`Migration completed: ${result.migrated} rooms migrated, ${result.errors} errors in ${duration}s`);

            return result;
        } catch (error) {
            result.details.endTime = Date.now();
            console.error('Data migration failed:', error);
            throw error;
        }
    }
}

module.exports = PersistenceManager;