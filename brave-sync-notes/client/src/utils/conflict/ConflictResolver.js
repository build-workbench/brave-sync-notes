import ConflictDetector from './ConflictDetector';

/**
 * 冲突解决策略类型
 * @typedef {'manual' | 'last-write-wins' | 'first-write-wins' | 'auto-merge'} ConflictResolutionStrategy
 */

/**
 * 冲突解决器
 * 管理冲突解决流程
 */
class ConflictResolver {
    constructor(options = {}) {
        this.detector = new ConflictDetector(options);
        this.defaultStrategy = options.defaultStrategy || 'manual';
        this.conflictQueue = [];
        this.resolving = false;
    }

    /**
     * 解决冲突
     * @param {ConflictInfo} conflict - 冲突信息
     * @param {ConflictResolutionStrategy} strategy - 解决策略
     * @returns {Promise<string>} 解决后的内容
     */
    async resolve(conflict, strategy = this.defaultStrategy) {
        if (strategy === 'manual') {
            // 手动解决需要用户介入
            throw new Error('Manual resolution required. Use resolveManually() instead.');
        }

        if (strategy === 'auto-merge') {
            // 尝试自动合并
            if (conflict.commonAncestor) {
                const result = this.detector.threeWayMerge(
                    conflict.commonAncestor.content,
                    conflict.localVersion.content,
                    conflict.remoteVersion.content
                );

                if (result.success) {
                    return result.merged;
                }

                // 自动合并失败，降级到 last-write-wins
                console.warn('Auto-merge failed, falling back to last-write-wins');
                return this.detector.autoResolve(conflict, 'last-write-wins');
            }

            // 没有共同祖先，使用 last-write-wins
            return this.detector.autoResolve(conflict, 'last-write-wins');
        }

        // 使用指定的策略
        return this.detector.autoResolve(conflict, strategy);
    }

    /**
     * 手动解决冲突
     * @param {ConflictInfo} conflict - 冲突信息
     * @param {string} resolvedContent - 用户选择的内容
     * @returns {Promise<string>}
     */
    async resolveManually(conflict, resolvedContent) {
        if (!resolvedContent) {
            throw new Error('Resolved content is required for manual resolution');
        }

        console.log('Conflict resolved manually');
        return resolvedContent;
    }

    /**
     * 添加冲突到队列
     * @param {ConflictInfo} conflict - 冲突信息
     */
    enqueueConflict(conflict) {
        this.conflictQueue.push({
            conflict,
            timestamp: Date.now(),
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        console.log(`Conflict enqueued. Queue size: ${this.conflictQueue.length}`);
    }

    /**
     * 获取下一个待解决的冲突
     * @returns {Object|null}
     */
    getNextConflict() {
        return this.conflictQueue.length > 0 ? this.conflictQueue[0] : null;
    }

    /**
     * 移除已解决的冲突
     * @param {string} conflictId - 冲突ID
     */
    removeConflict(conflictId) {
        this.conflictQueue = this.conflictQueue.filter(item => item.id !== conflictId);
        console.log(`Conflict removed. Queue size: ${this.conflictQueue.length}`);
    }

    /**
     * 获取冲突队列大小
     * @returns {number}
     */
    getQueueSize() {
        return this.conflictQueue.length;
    }

    /**
     * 清空冲突队列
     */
    clearQueue() {
        this.conflictQueue = [];
        console.log('Conflict queue cleared');
    }

    /**
     * 批量解决冲突
     * @param {ConflictResolutionStrategy} strategy - 解决策略
     * @returns {Promise<Array<{id: string, resolved: string}>>}
     */
    async resolveAll(strategy = 'last-write-wins') {
        if (this.resolving) {
            throw new Error('Already resolving conflicts');
        }

        this.resolving = true;
        const results = [];

        try {
            while (this.conflictQueue.length > 0) {
                const item = this.conflictQueue[0];

                try {
                    const resolved = await this.resolve(item.conflict, strategy);
                    results.push({
                        id: item.id,
                        resolved
                    });
                    this.removeConflict(item.id);
                } catch (error) {
                    console.error(`Failed to resolve conflict ${item.id}:`, error);
                    // 跳过这个冲突，继续处理下一个
                    this.conflictQueue.shift();
                }
            }
        } finally {
            this.resolving = false;
        }

        return results;
    }

    /**
     * 检查是否有待解决的冲突
     * @returns {boolean}
     */
    hasConflicts() {
        return this.conflictQueue.length > 0;
    }

    /**
     * 获取冲突统计信息
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.conflictQueue.length,
            byType: {
                concurrent_edit: 0,
                offline_divergence: 0
            },
            oldest: null,
            newest: null
        };

        if (this.conflictQueue.length > 0) {
            this.conflictQueue.forEach(item => {
                stats.byType[item.conflict.type]++;
            });

            stats.oldest = this.conflictQueue[0].timestamp;
            stats.newest = this.conflictQueue[this.conflictQueue.length - 1].timestamp;
        }

        return stats;
    }

    /**
     * 生成冲突摘要
     * @returns {string}
     */
    generateSummary() {
        const stats = this.getStats();

        if (stats.total === 0) {
            return 'No conflicts';
        }

        const lines = [];
        lines.push(`Total conflicts: ${stats.total}`);
        lines.push(`Concurrent edits: ${stats.byType.concurrent_edit}`);
        lines.push(`Offline divergence: ${stats.byType.offline_divergence}`);

        if (stats.oldest) {
            const age = Date.now() - stats.oldest;
            const minutes = Math.floor(age / 60000);
            lines.push(`Oldest conflict: ${minutes} minutes ago`);
        }

        return lines.join('\n');
    }
}

export default ConflictResolver;
