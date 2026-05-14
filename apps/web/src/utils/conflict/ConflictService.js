import { hashContent as sharedHashContent, generateUniqueId } from '../shared';

/**
 * 冲突解决策略类型
 * @typedef {'manual' | 'last-write-wins' | 'first-write-wins' | 'auto-merge'} ConflictResolutionStrategy
 */

/**
 * 版本化内容
 * @typedef {Object} VersionedContent
 * @property {string} content - 内容
 * @property {number} version - 版本号
 * @property {number} timestamp - 时间戳
 * @property {string} deviceId - 设备ID
 * @property {number} [parentVersion] - 父版本号
 * @property {string} hash - 内容哈希
 */

/**
 * 冲突信息
 * @typedef {Object} ConflictInfo
 * @property {string} type - 冲突类型 ('concurrent_edit' | 'offline_divergence')
 * @property {VersionedContent} localVersion - 本地版本
 * @property {VersionedContent} remoteVersion - 远程版本
 * @property {VersionedContent} [commonAncestor] - 共同祖先版本
 */

/**
 * 冲突区域
 * @typedef {Object} ConflictRegion
 * @property {number} startLine - 起始行
 * @property {number} endLine - 结束行
 * @property {string} localContent - 本地内容
 * @property {string} remoteContent - 远程内容
 */

/**
 * 合并结果
 * @typedef {Object} MergeResult
 * @property {boolean} success - 是否成功
 * @property {string} [merged] - 合并后的内容
 * @property {ConflictRegion[]} [conflicts] - 冲突区域
 */

/**
 * 冲突服务
 * 统一的冲突检测与解决模块
 */
class ConflictService {
    constructor(options = {}) {
        this.conflictWindow = options.conflictWindow || 5000;
        this.defaultStrategy = options.defaultStrategy || 'manual';
        this.autoResolveStrategy = options.autoResolveStrategy || null;
        this.onConflictDetected = options.onConflictDetected || null;
        this.onConflictResolved = options.onConflictResolved || null;

        // 冲突队列
        this.conflictQueue = [];
        this.resolving = false;
    }

    // ==================== 内容哈希 ====================

    /**
     * 计算内容哈希
     * @param {string} content - 内容
     * @returns {string} 哈希值
     */
    hashContent(content) {
        return sharedHashContent(content);
    }

    // ==================== 冲突检测 ====================

    /**
     * 检测是否存在冲突
     * @param {VersionedContent} local - 本地版本
     * @param {VersionedContent} remote - 远程版本
     * @returns {ConflictInfo|null}
     */
    detectConflict(local, remote) {
        // 如果内容相同，没有冲突
        if (local.hash === remote.hash || local.content === remote.content) {
            return null;
        }

        // 如果版本号相同但内容不同，说明有冲突
        if (local.version === remote.version) {
            return {
                type: 'concurrent_edit',
                localVersion: local,
                remoteVersion: remote
            };
        }

        // 检查时间戳差异
        const timeDiff = Math.abs(local.timestamp - remote.timestamp);

        // 如果在冲突窗口内且版本号不同，可能是并发编辑
        if (timeDiff < this.conflictWindow) {
            return {
                type: 'concurrent_edit',
                localVersion: local,
                remoteVersion: remote
            };
        }

        // 如果本地版本比远程版本旧，但本地有修改
        if (local.version < remote.version && local.hash !== remote.hash) {
            return {
                type: 'offline_divergence',
                localVersion: local,
                remoteVersion: remote
            };
        }

        // 没有冲突
        return null;
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
            hash: this.hashContent(localData.content)
        };

        const remote = {
            content: remoteData.content,
            version: remoteData.version || 0,
            timestamp: remoteData.timestamp || Date.now(),
            deviceId: remoteData.deviceId || 'remote',
            hash: this.hashContent(remoteData.content)
        };

        // 检测冲突
        const conflict = this.detectConflict(local, remote);

        if (!conflict) {
            return {
                hasConflict: false,
                resolved: remote.content,
                conflict: null
            };
        }

        if (this.onConflictDetected) {
            this.onConflictDetected(conflict);
        }

        // 如果配置了自动解决策略，尝试自动解决
        if (this.autoResolveStrategy && this.autoResolveStrategy !== 'manual') {
            try {
                const resolved = await this.resolve(conflict, this.autoResolveStrategy);

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
        this.enqueueConflict(conflict);

        return {
            hasConflict: true,
            resolved: null,
            conflict
        };
    }

    // ==================== 三路合并 ====================

    /**
     * 三路合并算法
     * @param {string} base - 基础版本
     * @param {string} local - 本地版本
     * @param {string} remote - 远程版本
     * @returns {MergeResult}
     */
    threeWayMerge(base, local, remote) {
        // 如果本地和远程相同，没有冲突
        if (local === remote) {
            return {
                success: true,
                merged: local
            };
        }

        // 如果本地没有改变，使用远程版本
        if (base === local) {
            return {
                success: true,
                merged: remote
            };
        }

        // 如果远程没有改变，使用本地版本
        if (base === remote) {
            return {
                success: true,
                merged: local
            };
        }

        // 尝试逐行合并
        const baseLines = base.split('\n');
        const localLines = local.split('\n');
        const remoteLines = remote.split('\n');

        const result = this._mergeLines(baseLines, localLines, remoteLines);

        if (result.conflicts.length === 0) {
            return {
                success: true,
                merged: result.lines.join('\n')
            };
        }

        return {
            success: false,
            merged: result.lines.join('\n'),
            conflicts: result.conflicts
        };
    }

    /**
     * 逐行合并
     * @private
     */
    _mergeLines(baseLines, localLines, remoteLines) {
        const merged = [];
        const conflicts = [];

        let baseIdx = 0;
        let localIdx = 0;
        let remoteIdx = 0;

        while (baseIdx < baseLines.length || localIdx < localLines.length || remoteIdx < remoteLines.length) {
            const baseLine = baseLines[baseIdx] || '';
            const localLine = localLines[localIdx] || '';
            const remoteLine = remoteLines[remoteIdx] || '';

            // 如果三者相同，直接添加
            if (baseLine === localLine && baseLine === remoteLine) {
                merged.push(baseLine);
                baseIdx++;
                localIdx++;
                remoteIdx++;
                continue;
            }

            // 如果本地和基础相同，使用远程
            if (baseLine === localLine && baseLine !== remoteLine) {
                merged.push(remoteLine);
                baseIdx++;
                localIdx++;
                remoteIdx++;
                continue;
            }

            // 如果远程和基础相同，使用本地
            if (baseLine === remoteLine && baseLine !== localLine) {
                merged.push(localLine);
                baseIdx++;
                localIdx++;
                remoteIdx++;
                continue;
            }

            // 检测冲突区域
            const conflictStart = merged.length;
            const localConflictLines = [];
            const remoteConflictLines = [];

            // 收集冲突行
            while (localIdx < localLines.length && localLines[localIdx] !== baseLine) {
                localConflictLines.push(localLines[localIdx]);
                localIdx++;
            }

            while (remoteIdx < remoteLines.length && remoteLines[remoteIdx] !== baseLine) {
                remoteConflictLines.push(remoteLines[remoteIdx]);
                remoteIdx++;
            }

            // 添加冲突标记
            merged.push('<<<<<<< LOCAL');
            merged.push(...localConflictLines);
            merged.push('=======');
            merged.push(...remoteConflictLines);
            merged.push('>>>>>>> REMOTE');

            conflicts.push({
                startLine: conflictStart,
                endLine: merged.length - 1,
                localContent: localConflictLines.join('\n'),
                remoteContent: remoteConflictLines.join('\n')
            });

            baseIdx++;
        }

        return { lines: merged, conflicts };
    }

    // ==================== 自动解决 ====================

    /**
     * 自动解决简单冲突
     * @param {ConflictInfo} conflict - 冲突信息
     * @param {string} strategy - 解决策略
     * @returns {string}
     */
    autoResolve(conflict, strategy = 'last-write-wins') {
        switch (strategy) {
            case 'last-write-wins':
                // 使用时间戳最新的版本
                return conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
                    ? conflict.localVersion.content
                    : conflict.remoteVersion.content;

            case 'first-write-wins':
                // 使用时间戳最早的版本
                return conflict.localVersion.timestamp < conflict.remoteVersion.timestamp
                    ? conflict.localVersion.content
                    : conflict.remoteVersion.content;

            case 'local-wins':
                // 总是使用本地版本
                return conflict.localVersion.content;

            case 'remote-wins':
                // 总是使用远程版本
                return conflict.remoteVersion.content;

            case 'merge-both':
                // 尝试合并两个版本
                return this._mergeBoth(conflict.localVersion.content, conflict.remoteVersion.content);

            default:
                throw new Error(`Unknown resolution strategy: ${strategy}`);
        }
    }

    /**
     * 合并两个版本（简单追加）
     * @private
     */
    _mergeBoth(local, remote) {
        return `${local}\n\n--- MERGED FROM REMOTE ---\n\n${remote}`;
    }

    /**
     * 检查是否可以自动合并
     * @param {ConflictInfo} conflict - 冲突信息
     * @returns {boolean}
     */
    canAutoMerge(conflict) {
        // 如果有共同祖先，尝试三路合并
        if (conflict.commonAncestor) {
            const result = this.threeWayMerge(
                conflict.commonAncestor.content,
                conflict.localVersion.content,
                conflict.remoteVersion.content
            );
            return result.success;
        }

        // 检查是否只是简单的追加
        const local = conflict.localVersion.content;
        const remote = conflict.remoteVersion.content;

        // 如果一个是另一个的前缀，可以自动合并
        if (local.startsWith(remote) || remote.startsWith(local)) {
            return true;
        }

        return false;
    }

    // ==================== 冲突解决 ====================

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
                const result = this.threeWayMerge(
                    conflict.commonAncestor.content,
                    conflict.localVersion.content,
                    conflict.remoteVersion.content
                );

                if (result.success) {
                    return result.merged;
                }

                return this.autoResolve(conflict, 'last-write-wins');
            }

            // 没有共同祖先，使用 last-write-wins
            return this.autoResolve(conflict, 'last-write-wins');
        }

        // 使用指定的策略
        return this.autoResolve(conflict, strategy);
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

        return resolvedContent;
    }

    /**
     * 通过冲突ID手动解决
     * @param {string} conflictId - 冲突ID
     * @param {string} resolvedContent - 解决后的内容
     * @returns {Promise<void>}
     */
    async resolveConflictById(conflictId, resolvedContent) {
        const conflictItem = this.conflictQueue.find(item => item.id === conflictId);

        if (!conflictItem) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }

        const resolved = await this.resolveManually(conflictItem.conflict, resolvedContent);

        // 触发冲突解决回调
        if (this.onConflictResolved) {
            this.onConflictResolved(conflictItem.conflict, resolved);
        }

        // 从队列中移除
        this.removeConflict(conflictId);

        return resolved;
    }

    // ==================== 队列管理 ====================

    /**
     * 添加冲突到队列
     * @param {ConflictInfo} conflict - 冲突信息
     */
    enqueueConflict(conflict) {
        this.conflictQueue.push({
            conflict,
            timestamp: Date.now(),
            id: generateUniqueId('conflict_')
        });
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
    }

    /**
     * 检查是否有待解决的冲突
     * @returns {boolean}
     */
    hasConflicts() {
        return this.conflictQueue.length > 0;
    }

    /**
     * 获取待解决的冲突列表
     * @returns {Array}
     */
    getPendingConflicts() {
        return this.conflictQueue.map(item => ({
            id: item.id,
            type: item.conflict.type,
            timestamp: item.timestamp,
            localVersion: item.conflict.localVersion,
            remoteVersion: item.conflict.remoteVersion
        }));
    }

    /**
     * 获取冲突数量
     * @returns {number}
     */
    getConflictCount() {
        return this.conflictQueue.length;
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
     * 批量自动解决所有冲突
     * @param {string} strategy - 解决策略
     * @returns {Promise<number>} 解决的冲突数量
     */
    async resolveAllConflicts(strategy = 'last-write-wins') {
        const results = await this.resolveAll(strategy);

        // 触发每个冲突的解决回调
        if (this.onConflictResolved) {
            results.forEach(result => {
                this.onConflictResolved(null, result.resolved);
            });
        }

        return results.length;
    }

    /**
     * 清空冲突队列（别名）
     */
    clearConflicts() {
        this.clearQueue();
    }

    // ==================== 统计与报告 ====================

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

    /**
     * 生成冲突报告
     * @param {ConflictInfo} conflict - 冲突信息
     * @returns {string}
     */
    generateConflictReport(conflict) {
        const report = [];

        report.push('='.repeat(60));
        report.push('CONFLICT DETECTED');
        report.push('='.repeat(60));
        report.push('');
        report.push(`Type: ${conflict.type}`);
        report.push('');
        report.push('Local Version:');
        report.push(`  Version: ${conflict.localVersion.version}`);
        report.push(`  Timestamp: ${new Date(conflict.localVersion.timestamp).toISOString()}`);
        report.push(`  Device: ${conflict.localVersion.deviceId}`);
        report.push('');
        report.push('Remote Version:');
        report.push(`  Version: ${conflict.remoteVersion.version}`);
        report.push(`  Timestamp: ${new Date(conflict.remoteVersion.timestamp).toISOString()}`);
        report.push(`  Device: ${conflict.remoteVersion.deviceId}`);
        report.push('');
        report.push('='.repeat(60));

        return report.join('\n');
    }

    /**
     * 通过冲突ID生成报告
     * @param {string} conflictId - 冲突ID
     * @returns {string|null}
     */
    generateReport(conflictId) {
        const conflictItem = this.conflictQueue.find(item => item.id === conflictId);

        if (!conflictItem) {
            return null;
        }

        return this.generateConflictReport(conflictItem.conflict);
    }

    // ==================== 回调设置 ====================

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

export default ConflictService;
