const { PersistenceAdapter, DataSerializer, DataValidator } = require('./PersistenceAdapter');
const Redis = require('redis');

/**
 * Redis 持久化存储实现
 * 使用 Redis Hash 存储房间数据，Redis List 存储操作日志
 */
class RedisPersistence extends PersistenceAdapter {
    constructor(options = {}) {
        super();

        this.options = {
            host: options.host || process.env.REDIS_HOST || 'localhost',
            port: options.port || process.env.REDIS_PORT || 6379,
            password: options.password || process.env.REDIS_PASSWORD,
            db: options.db || process.env.REDIS_DB || 0,
            keyPrefix: options.keyPrefix || 'notesync:',
            defaultTTL: options.defaultTTL || 7 * 24 * 60 * 60, // 7天
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            ...options
        };

        this.client = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    /**
     * 连接到 Redis
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._doConnect();
        return this.connectionPromise;
    }

    async _doConnect() {
        try {
            this.client = Redis.createClient({
                host: this.options.host,
                port: this.options.port,
                password: this.options.password,
                db: this.options.db,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        console.error('Redis connection refused');
                        return new Error('Redis connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        console.error('Redis retry time exhausted');
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > this.options.maxRetries) {
                        console.error('Redis max retries exceeded');
                        return new Error('Max retries exceeded');
                    }
                    return Math.min(options.attempt * this.options.retryDelay, 3000);
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis client error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Connected to Redis');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Disconnected from Redis');
                this.isConnected = false;
            });

            await this.client.connect();
            this.isConnected = true;

            console.log(`Redis persistence initialized: ${this.options.host}:${this.options.port}`);
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            this.connectionPromise = null;
            throw error;
        }
    }

    /**
     * 确保连接可用
     * @private
     */
    async _ensureConnection() {
        if (!this.isConnected || !this.client) {
            await this.connect();
        }
    }

    /**
     * 生成房间数据的 Redis key
     * @param {string} roomId 
     * @returns {string}
     */
    _getRoomKey(roomId) {
        return `${this.options.keyPrefix}room:${roomId}`;
    }

    /**
     * 生成操作日志的 Redis key
     * @param {string} roomId 
     * @returns {string}
     */
    _getLogKey(roomId) {
        return `${this.options.keyPrefix}log:${roomId}`;
    }

    /**
     * 保存同步链数据
     * @param {string} roomId - 房间ID
     * @param {EncryptedRoomData} data - 加密的房间数据
     * @returns {Promise<void>}
     */
    async saveRoom(roomId, data) {
        if (!DataValidator.isValidRoomId(roomId)) {
            throw new Error('Invalid room ID');
        }

        if (!DataValidator.isValidRoomData(data)) {
            throw new Error('Invalid room data');
        }

        await this._ensureConnection();

        const key = this._getRoomKey(roomId);
        const serializedData = DataSerializer.serialize(data);
        const compressedData = DataSerializer.compress(serializedData);

        try {
            // 使用 Redis Hash 存储房间数据
            await this.client.hSet(key, {
                data: compressedData,
                timestamp: data.timestamp.toString(),
                version: data.version.toString(),
                deviceName: data.deviceName,
                hash: data.hash || ''
            });

            // 设置 TTL
            await this.client.expire(key, this.options.defaultTTL);

            console.log(`Saved room data: ${roomId.substring(0, 8)}... (${compressedData.length} bytes)`);
        } catch (error) {
            console.error(`Failed to save room ${roomId}:`, error);
            throw new Error(`Failed to save room data: ${error.message}`);
        }
    }

    /**
     * 获取同步链数据
     * @param {string} roomId - 房间ID
     * @returns {Promise<EncryptedRoomData|null>}
     */
    async getRoom(roomId) {
        if (!DataValidator.isValidRoomId(roomId)) {
            throw new Error('Invalid room ID');
        }

        await this._ensureConnection();

        const key = this._getRoomKey(roomId);

        try {
            const hashData = await this.client.hGetAll(key);

            if (!hashData || !hashData.data) {
                return null;
            }

            // 解压缩和反序列化数据
            const decompressedData = DataSerializer.decompress(hashData.data);
            const roomData = DataSerializer.deserialize(decompressedData);

            // 更新 TTL
            await this.client.expire(key, this.options.defaultTTL);

            console.log(`Retrieved room data: ${roomId.substring(0, 8)}...`);
            return roomData;
        } catch (error) {
            console.error(`Failed to get room ${roomId}:`, error);
            throw new Error(`Failed to get room data: ${error.message}`);
        }
    }

    /**
     * 删除过期数据
     * @param {Date} olderThan - 删除早于此时间的数据
     * @returns {Promise<number>} 删除的记录数量
     */
    async cleanupExpired(olderThan) {
        await this._ensureConnection();

        const cutoffTimestamp = olderThan.getTime();
        let deletedCount = 0;

        try {
            // 扫描所有房间 key
            const roomPattern = `${this.options.keyPrefix}room:*`;
            const keys = await this.client.keys(roomPattern);

            for (const key of keys) {
                try {
                    const timestampStr = await this.client.hGet(key, 'timestamp');
                    if (timestampStr) {
                        const timestamp = parseInt(timestampStr);
                        if (timestamp < cutoffTimestamp) {
                            // 删除房间数据和对应的日志
                            const roomId = key.replace(`${this.options.keyPrefix}room:`, '');
                            const logKey = this._getLogKey(roomId);

                            await this.client.del(key);
                            await this.client.del(logKey);
                            deletedCount++;
                        }
                    }
                } catch (error) {
                    console.error(`Error processing key ${key}:`, error);
                }
            }

            console.log(`Cleaned up ${deletedCount} expired rooms`);
            return deletedCount;
        } catch (error) {
            console.error('Failed to cleanup expired data:', error);
            throw new Error(`Failed to cleanup expired data: ${error.message}`);
        }
    }

    /**
     * 保存操作日志
     * @param {string} roomId - 房间ID
     * @param {Operation} operation - 操作记录
     * @returns {Promise<void>}
     */
    async appendLog(roomId, operation) {
        if (!DataValidator.isValidRoomId(roomId)) {
            throw new Error('Invalid room ID');
        }

        if (!DataValidator.isValidOperation(operation)) {
            throw new Error('Invalid operation');
        }

        await this._ensureConnection();

        const key = this._getLogKey(roomId);
        const serializedOp = JSON.stringify(operation);

        try {
            // 使用 Redis List 存储操作日志
            await this.client.rPush(key, serializedOp);

            // 限制日志长度，只保留最近的1000条操作
            await this.client.lTrim(key, -1000, -1);

            // 设置 TTL
            await this.client.expire(key, this.options.defaultTTL);

            console.log(`Appended operation to log: ${roomId.substring(0, 8)}... op:${operation.type}`);
        } catch (error) {
            console.error(`Failed to append log for room ${roomId}:`, error);
            throw new Error(`Failed to append operation log: ${error.message}`);
        }
    }

    /**
     * 获取操作日志
     * @param {string} roomId - 房间ID
     * @param {number} since - 获取此版本号之后的操作
     * @returns {Promise<Operation[]>}
     */
    async getLog(roomId, since = 0) {
        if (!DataValidator.isValidRoomId(roomId)) {
            throw new Error('Invalid room ID');
        }

        await this._ensureConnection();

        const key = this._getLogKey(roomId);

        try {
            // 获取所有日志条目
            const logEntries = await this.client.lRange(key, 0, -1);

            const operations = [];
            for (const entry of logEntries) {
                try {
                    const operation = JSON.parse(entry);
                    if (operation.version > since) {
                        operations.push(operation);
                    }
                } catch (error) {
                    console.error('Failed to parse log entry:', error);
                }
            }

            // 按版本号排序
            operations.sort((a, b) => a.version - b.version);

            console.log(`Retrieved ${operations.length} operations for room: ${roomId.substring(0, 8)}...`);
            return operations;
        } catch (error) {
            console.error(`Failed to get log for room ${roomId}:`, error);
            throw new Error(`Failed to get operation log: ${error.message}`);
        }
    }

    /**
     * 检查存储连接状态
     * @returns {Promise<boolean>}
     */
    async isHealthy() {
        try {
            if (!this.client || !this.isConnected) {
                return false;
            }

            // 执行简单的 ping 命令
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }

    /**
     * 关闭存储连接
     * @returns {Promise<void>}
     */
    async close() {
        if (this.client) {
            try {
                await this.client.quit();
                console.log('Redis connection closed');
            } catch (error) {
                console.error('Error closing Redis connection:', error);
            } finally {
                this.client = null;
                this.isConnected = false;
                this.connectionPromise = null;
            }
        }
    }

    /**
     * 获取存储统计信息
     * @returns {Promise<Object>}
     */
    async getStats() {
        await this._ensureConnection();

        try {
            const info = await this.client.info('memory');
            const keyCount = await this.client.dbSize();

            // 统计房间和日志数量
            const roomKeys = await this.client.keys(`${this.options.keyPrefix}room:*`);
            const logKeys = await this.client.keys(`${this.options.keyPrefix}log:*`);

            return {
                connected: this.isConnected,
                totalKeys: keyCount,
                roomCount: roomKeys.length,
                logCount: logKeys.length,
                memoryInfo: info,
                host: this.options.host,
                port: this.options.port,
                db: this.options.db
            };
        } catch (error) {
            console.error('Failed to get Redis stats:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

module.exports = RedisPersistence;