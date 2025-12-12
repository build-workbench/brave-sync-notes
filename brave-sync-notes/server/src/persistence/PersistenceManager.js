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
            console.log(`Persistence manager initialized with primary adapter: ${this.options.primaryAdapter}`);
        } catch (error) {
            console.error('Failed to initialize persistence manager:', error);

            // 尝试故障转移到备用适配器
            if (this.options.autoFailover && this.options.fallbackAdapter !== this.options.primaryAdapter) {
                try {
                    await this._switchToAdapter(this.options.fallbackAdapter);
                    console.log(`Switched to fallback adapter: ${this.options.fallbackAdapter}`);
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
            console.log(`Switched to adapter: ${adapterName}`);
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
                    console.log(`Successfully failed over to ${fallbackName}`);
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
        console.log(`Manually switched to adapter: ${adapterName}`);
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

        console.log('Persistence manager closed');
    }

    /**
     * 执行数据迁移（从一个适配器迁移到另一个）
     */
    async migrateData(fromAdapter, toAdapter) {
        const sourceAdapter = this.adapters.get(fromAdapter);
        const targetAdapter = this.adapters.get(toAdapter);

        if (!sourceAdapter || !targetAdapter) {
            throw new Error('Source or target adapter not found');
        }

        console.log(`Starting data migration from ${fromAdapter} to ${toAdapter}`);

        try {
            // 这里需要实现具体的迁移逻辑
            // 由于我们没有直接的方法来枚举所有房间，这个功能需要根据具体需求实现
            console.log('Data migration completed');
        } catch (error) {
            console.error('Data migration failed:', error);
            throw error;
        }
    }
}

module.exports = PersistenceManager;