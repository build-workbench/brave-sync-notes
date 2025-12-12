/**
 * 持久化存储适配器接口
 * 定义了所有持久化存储实现必须遵循的接口
 */

/**
 * 加密的房间数据结构
 * @typedef {Object} EncryptedRoomData
 * @property {string} encryptedData - 加密的笔记内容
 * @property {number} timestamp - 最后更新时间戳
 * @property {string} deviceName - 最后更新的设备名称
 * @property {number} version - 数据版本号
 * @property {string} hash - 数据完整性校验哈希
 */

/**
 * 操作记录结构
 * @typedef {Object} Operation
 * @property {string} id - 操作唯一标识符
 * @property {string} type - 操作类型 ('insert', 'delete', 'replace')
 * @property {number} position - 操作位置
 * @property {string} [content] - 插入或替换的内容
 * @property {number} [length] - 删除的长度
 * @property {number} timestamp - 操作时间戳
 * @property {string} deviceId - 执行操作的设备ID
 * @property {number} version - 操作版本号
 */

/**
 * 持久化存储适配器抽象类
 * 所有具体的存储实现都应该继承这个类
 */
class PersistenceAdapter {
    /**
     * 保存同步链数据
     * @param {string} roomId - 房间ID
     * @param {EncryptedRoomData} data - 加密的房间数据
     * @returns {Promise<void>}
     */
    async saveRoom(roomId, data) {
        throw new Error('saveRoom method must be implemented');
    }

    /**
     * 获取同步链数据
     * @param {string} roomId - 房间ID
     * @returns {Promise<EncryptedRoomData|null>}
     */
    async getRoom(roomId) {
        throw new Error('getRoom method must be implemented');
    }

    /**
     * 删除过期数据
     * @param {Date} olderThan - 删除早于此时间的数据
     * @returns {Promise<number>} 删除的记录数量
     */
    async cleanupExpired(olderThan) {
        throw new Error('cleanupExpired method must be implemented');
    }

    /**
     * 保存操作日志
     * @param {string} roomId - 房间ID
     * @param {Operation} operation - 操作记录
     * @returns {Promise<void>}
     */
    async appendLog(roomId, operation) {
        throw new Error('appendLog method must be implemented');
    }

    /**
     * 获取操作日志
     * @param {string} roomId - 房间ID
     * @param {number} since - 获取此版本号之后的操作
     * @returns {Promise<Operation[]>}
     */
    async getLog(roomId, since) {
        throw new Error('getLog method must be implemented');
    }

    /**
     * 检查存储连接状态
     * @returns {Promise<boolean>}
     */
    async isHealthy() {
        throw new Error('isHealthy method must be implemented');
    }

    /**
     * 关闭存储连接
     * @returns {Promise<void>}
     */
    async close() {
        throw new Error('close method must be implemented');
    }

    /**
     * 获取存储统计信息
     * @returns {Promise<Object>}
     */
    async getStats() {
        throw new Error('getStats method must be implemented');
    }
}

module.exports = {
    PersistenceAdapter,
    /**
     * 数据序列化工具
     */
    DataSerializer: {
        /**
         * 序列化房间数据
         * @param {EncryptedRoomData} data 
         * @returns {string}
         */
        serialize(data) {
            return JSON.stringify({
                ...data,
                _serialized: true,
                _version: '1.0'
            });
        },

        /**
         * 反序列化房间数据
         * @param {string} serializedData 
         * @returns {EncryptedRoomData}
         */
        deserialize(serializedData) {
            try {
                const data = JSON.parse(serializedData);
                if (!data._serialized) {
                    throw new Error('Invalid serialized data format');
                }

                // 移除序列化标记
                delete data._serialized;
                delete data._version;

                return data;
            } catch (error) {
                throw new Error(`Failed to deserialize data: ${error.message}`);
            }
        },

        /**
         * 压缩数据（使用简单的字符串压缩）
         * @param {string} data 
         * @returns {string}
         */
        compress(data) {
            // 为了简化和确保正确性，暂时不进行压缩
            // 在生产环境中可以使用成熟的压缩库如 zlib
            return data;
        },

        /**
         * 解压缩数据
         * @param {string} compressedData 
         * @returns {string}
         */
        decompress(compressedData) {
            // 对应 compress 函数，暂时不进行解压缩
            return compressedData;
        }
    },

    /**
     * 数据验证工具
     */
    DataValidator: {
        /**
         * 验证房间ID格式
         * @param {string} roomId 
         * @returns {boolean}
         */
        isValidRoomId(roomId) {
            return typeof roomId === 'string' &&
                roomId.length >= 10 &&
                roomId.length <= 100 &&
                /^[a-zA-Z0-9_-]+$/.test(roomId);
        },

        /**
         * 验证房间数据格式
         * @param {EncryptedRoomData} data 
         * @returns {boolean}
         */
        isValidRoomData(data) {
            if (!data || typeof data !== 'object') {
                return false;
            }
            return typeof data.encryptedData === 'string' &&
                typeof data.timestamp === 'number' &&
                typeof data.deviceName === 'string' &&
                typeof data.version === 'number' &&
                data.timestamp > 0 &&
                data.version >= 0;
        },

        /**
         * 验证操作记录格式
         * @param {Operation} operation 
         * @returns {boolean}
         */
        isValidOperation(operation) {
            if (!operation || typeof operation !== 'object') {
                return false;
            }
            return typeof operation.id === 'string' &&
                ['insert', 'delete', 'replace'].includes(operation.type) &&
                typeof operation.position === 'number' &&
                typeof operation.timestamp === 'number' &&
                typeof operation.deviceId === 'string' &&
                typeof operation.version === 'number' &&
                operation.position >= 0 &&
                operation.timestamp > 0 &&
                operation.version >= 0;
        }
    }
};