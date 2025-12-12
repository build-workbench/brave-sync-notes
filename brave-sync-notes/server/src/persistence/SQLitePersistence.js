const { PersistenceAdapter, DataSerializer, DataValidator } = require('./PersistenceAdapter');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

/**
 * SQLite 持久化存储实现
 * 作为 Redis 的备用方案，使用文件数据库存储
 */
class SQLitePersistence extends PersistenceAdapter {
    constructor(options = {}) {
        super();

        this.options = {
            dbPath: options.dbPath || process.env.SQLITE_DB_PATH || './data/notesync.db',
            maxConnections: options.maxConnections || 10,
            busyTimeout: options.busyTimeout || 30000,
            defaultTTL: options.defaultTTL || 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
            ...options
        };

        this.db = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    /**
     * 连接到 SQLite 数据库
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
            // 确保数据目录存在
            const dbDir = path.dirname(this.options.dbPath);
            await fs.mkdir(dbDir, { recursive: true });

            // 创建数据库连接
            this.db = new sqlite3.Database(this.options.dbPath, (err) => {
                if (err) {
                    console.error('Failed to connect to SQLite:', err);
                    throw err;
                }
            });

            // 设置数据库配置
            await this._runQuery('PRAGMA busy_timeout = ?', [this.options.busyTimeout]);
            await this._runQuery('PRAGMA journal_mode = WAL');
            await this._runQuery('PRAGMA synchronous = NORMAL');
            await this._runQuery('PRAGMA cache_size = 10000');
            await this._runQuery('PRAGMA foreign_keys = ON');

            // 创建表结构
            await this._createTables();

            this.isConnected = true;
            console.log(`SQLite persistence initialized: ${this.options.dbPath}`);
        } catch (error) {
            console.error('Failed to initialize SQLite:', error);
            this.isConnected = false;
            this.connectionPromise = null;
            throw error;
        }
    }

    /**
     * 创建数据库表结构
     * @private
     */
    async _createTables() {
        // 房间数据表
        await this._runQuery(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 0,
        device_name TEXT NOT NULL,
        hash TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

        // 操作日志表
        await this._runQuery(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        operation_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        position INTEGER NOT NULL,
        content TEXT,
        length INTEGER,
        timestamp INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (room_id) REFERENCES rooms (room_id) ON DELETE CASCADE
      )
    `);

        // 创建索引
        await this._runQuery('CREATE INDEX IF NOT EXISTS idx_rooms_timestamp ON rooms (timestamp)');
        await this._runQuery('CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms (updated_at)');
        await this._runQuery('CREATE INDEX IF NOT EXISTS idx_logs_room_id ON operation_logs (room_id)');
        await this._runQuery('CREATE INDEX IF NOT EXISTS idx_logs_version ON operation_logs (room_id, version)');
        await this._runQuery('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON operation_logs (timestamp)');

        console.log('SQLite tables and indexes created successfully');
    }

    /**
     * 执行 SQL 查询
     * @private
     */
    async _runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * 执行 SQL 查询并获取单行结果
     * @private
     */
    async _getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * 执行 SQL 查询并获取所有结果
     * @private
     */
    async _allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * 确保连接可用
     * @private
     */
    async _ensureConnection() {
        if (!this.isConnected || !this.db) {
            await this.connect();
        }
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

        const serializedData = DataSerializer.serialize(data);
        const compressedData = DataSerializer.compress(serializedData);
        const now = Date.now();

        try {
            // 使用 UPSERT 语法
            await this._runQuery(`
        INSERT INTO rooms (room_id, encrypted_data, timestamp, version, device_name, hash, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(room_id) DO UPDATE SET
          encrypted_data = excluded.encrypted_data,
          timestamp = excluded.timestamp,
          version = excluded.version,
          device_name = excluded.device_name,
          hash = excluded.hash,
          updated_at = excluded.updated_at
      `, [roomId, compressedData, data.timestamp, data.version, data.deviceName, data.hash || '', now]);

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

        try {
            const row = await this._getQuery(
                'SELECT encrypted_data, timestamp, version, device_name, hash FROM rooms WHERE room_id = ?',
                [roomId]
            );

            if (!row) {
                return null;
            }

            // 解压缩和反序列化数据
            const decompressedData = DataSerializer.decompress(row.encrypted_data);
            const roomData = DataSerializer.deserialize(decompressedData);

            // 更新访问时间
            await this._runQuery(
                'UPDATE rooms SET updated_at = ? WHERE room_id = ?',
                [Date.now(), roomId]
            );

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

        try {
            // 删除过期的房间数据（级联删除会自动删除相关日志）
            const result = await this._runQuery(
                'DELETE FROM rooms WHERE updated_at < ?',
                [cutoffTimestamp]
            );

            console.log(`Cleaned up ${result.changes} expired rooms`);
            return result.changes;
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

        try {
            await this._runQuery(`
        INSERT INTO operation_logs 
        (room_id, operation_id, operation_type, position, content, length, timestamp, device_id, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                roomId,
                operation.id,
                operation.type,
                operation.position,
                operation.content || null,
                operation.length || null,
                operation.timestamp,
                operation.deviceId,
                operation.version
            ]);

            // 限制日志数量，只保留每个房间最近的1000条操作
            await this._runQuery(`
        DELETE FROM operation_logs 
        WHERE room_id = ? AND id NOT IN (
          SELECT id FROM operation_logs 
          WHERE room_id = ? 
          ORDER BY version DESC, timestamp DESC 
          LIMIT 1000
        )
      `, [roomId, roomId]);

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

        try {
            const rows = await this._allQuery(`
        SELECT operation_id, operation_type, position, content, length, timestamp, device_id, version
        FROM operation_logs 
        WHERE room_id = ? AND version > ?
        ORDER BY version ASC, timestamp ASC
      `, [roomId, since]);

            const operations = rows.map(row => ({
                id: row.operation_id,
                type: row.operation_type,
                position: row.position,
                content: row.content,
                length: row.length,
                timestamp: row.timestamp,
                deviceId: row.device_id,
                version: row.version
            }));

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
            if (!this.db || !this.isConnected) {
                return false;
            }

            // 执行简单的查询测试连接
            await this._getQuery('SELECT 1 as test');
            return true;
        } catch (error) {
            console.error('SQLite health check failed:', error);
            return false;
        }
    }

    /**
     * 关闭存储连接
     * @returns {Promise<void>}
     */
    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing SQLite connection:', err);
                    } else {
                        console.log('SQLite connection closed');
                    }
                    this.db = null;
                    this.isConnected = false;
                    this.connectionPromise = null;
                    resolve();
                });
            });
        }
    }

    /**
     * 获取存储统计信息
     * @returns {Promise<Object>}
     */
    async getStats() {
        await this._ensureConnection();

        try {
            const roomCount = await this._getQuery('SELECT COUNT(*) as count FROM rooms');
            const logCount = await this._getQuery('SELECT COUNT(*) as count FROM operation_logs');
            const dbSize = await this._getQuery('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');

            return {
                connected: this.isConnected,
                roomCount: roomCount.count,
                logCount: logCount.count,
                databaseSize: dbSize.size,
                databasePath: this.options.dbPath
            };
        } catch (error) {
            console.error('Failed to get SQLite stats:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * 执行数据库维护操作
     * @returns {Promise<void>}
     */
    async maintenance() {
        await this._ensureConnection();

        try {
            // 执行 VACUUM 来压缩数据库
            await this._runQuery('VACUUM');

            // 分析表以优化查询计划
            await this._runQuery('ANALYZE');

            console.log('SQLite maintenance completed');
        } catch (error) {
            console.error('SQLite maintenance failed:', error);
            throw new Error(`Database maintenance failed: ${error.message}`);
        }
    }
}

module.exports = SQLitePersistence;