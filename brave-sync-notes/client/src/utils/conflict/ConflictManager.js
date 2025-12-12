import ConflictDetector from './ConflictDetector';
import ConflictResolver from './ConflictResolver';

/**
 * 冲突管理器
 * 集成冲突检测和解决到同步流程
 */
class ConflictManager {
    constructor(options = {}) {
        this.detector = new ConflictDetector(options);
        this.resolver = new ConflictResolver(options);
        this.onConflictDetected = options.onConflictDetected || null;
        this.onConflictResolved = options.onConflictResolved || null;
        this.autoResolveStrategy = options.autoResolveStrategy || null;
    }

    /**
     * 检查并处理同步更新中的冲突
     * @param {Object} localData - 本地数据
     * @param {Object} remoteData - 远程数据
     * @returns {Promise<{hasConflict: boolean, resolved: string|null, conflict: ConflictInfo|null}>}
     */
    async checkAndHandle(localData, remoteData) {
        // 创建版本化内容对象
        const local = {
            content: localData.content,
            version: localData.version || 0,
            timestamp: localData.timestamp || Date.now(),
            deviceId: localData.deviceId || 'local',
            hash: this.detector.hashContent(localData.content)
        };

        const remote = {
            content: remoteData.content,
            version: remoteData.version || 0,
            timestamp: remoteData.timestamp || Date.now(),
            deviceId: remoteData.deviceId || 'remote',
            hash: this.detector.hashContent(remoteData.content)
        };

        // 检测冲突
        const conflict = this.detector.detectConflict(local, remote);

        if (!conflict) {
            // 没有冲突，使用远程版本
            return {
                hasConflict: false,
                resolved: remote.content,
                conflict: null
            };
        }

        console.warn('Conflict detected:', conflict.type);

        // 触发冲突检测回调
        if (this.onConflictDetected) {
            this.onConflictDetected(conflict);
        }

        // 如果配置了自动解决策略，尝试自动解决
        if (this.autoResolveStrategy && this.autoResolveStrategy !== 'manual') {
            try {
                const resolved = await this.resolver.resolve(conflict, this.autoResolveStrategy);

                console.log('Conflict auto-resolved using strategy:', this.autoResolveStrategy);

                // 触发冲突解决回调
                if (this.onConflictResolved) {
                    this.onConflictResolved(conflict, resolved);
                }

                return {
                    hasConflict: true,
                    resolved,
                    conflict
                };
            } catch (error) {
                console.error('Auto-resolve failed:', error);
            }
        }

        // 添加到冲突队列，等待手动解决
        this.resolver.enqueueConflict(conflict);

        return {
            hasConflict: true,
            resolved: null,
            conflict
        };
    }

    /**
     * 手动解决冲突
     * @param {string} conflictId - 冲突ID
     * @param {string} resolvedContent - 解决后的内容
     * @returns {Promise<void>}
     */
    async resolveManually(conflictId, resolvedContent) {
        const conflictItem = this.resolver.conflictQueue.find(item => item.id === conflictId);

        if (!conflictItem) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }

        const resolved = await this.resolver.resolveManually(conflictItem.conflict, resolvedContent);

        // 触发冲突解决回调
        if (this.onConflictResolved) {
            this.onConflictResolved(conflictItem.conflict, resolved);
        }

        // 从队列中移除
        this.resolver.removeConflict(conflictId);

        return resolved;
    }

    /**
     * 获取待解决的冲突列表
     * @returns {Array}
     */
    getPendingConflicts() {
        return this.resolver.conflictQueue.map(item => ({
            id: item.id,
            type: item.conflict.type,
            timestamp: item.timestamp,
            localVersion: item.conflict.localVersion,
            remoteVersion: item.conflict.remoteVersion
        }));
    }

    /**
     * 检查是否有待解决的冲突
     * @returns {boolean}
     */
    hasConflicts() {
        return this.resolver.hasConflicts();
    }

    /**
     * 获取冲突数量
     * @returns {number}
     */
    getConflictCount() {
        return this.resolver.getQueueSize();
    }

    /**
     * 批量自动解决所有冲突
     * @param {string} strategy - 解决策略
     * @returns {Promise<number>} 解决的冲突数量
     */
    async resolveAllConflicts(strategy = 'last-write-wins') {
        const results = await this.resolver.resolveAll(strategy);

        // 触发每个冲突的解决回调
        if (this.onConflictResolved) {
            results.forEach(result => {
                this.onConflictResolved(null, result.resolved);
            });
        }

        return results.length;
    }

    /**
     * 清空冲突队列
     */
    clearConflicts() {
        this.resolver.clearQueue();
    }

    /**
     * 获取冲突统计信息
     * @returns {Object}
     */
    getStats() {
        return this.resolver.getStats();
    }

    /**
     * 生成冲突报告
     * @param {string} conflictId - 冲突ID
     * @returns {string|null}
     */
    generateReport(conflictId) {
        const conflictItem = this.resolver.conflictQueue.find(item => item.id === conflictId);

        if (!conflictItem) {
            return null;
        }

        return this.detector.generateConflictReport(conflictItem.conflict);
    }

    /**
     * 设置冲突检测回调
     * @param {Function} callback - 回调函数
     */
    setOnConflictDetected(callback) {
        this.onConflictDetected = callback;
    }

    /**
     * 设置冲突解决回调
     * @param {Function} callback - 回调函数
     */
    setOnConflictResolved(callback) {
        this.onConflictResolved = callback;
    }

    /**
     * 设置自动解决策略
     * @param {string} strategy - 策略名称
     */
    setAutoResolveStrategy(strategy) {
        this.autoResolveStrategy = strategy;
    }
}

export default ConflictManager;
