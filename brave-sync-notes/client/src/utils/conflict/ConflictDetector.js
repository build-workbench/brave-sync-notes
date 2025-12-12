/**
 * 冲突检测器
 * 检测并处理多设备编辑冲突
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

class ConflictDetector {
    constructor(options = {}) {
        this.conflictWindow = options.conflictWindow || 5000; // 5秒内的更新视为并发
    }

    /**
     * 计算内容哈希
     * @param {string} content - 内容
     * @returns {string} 哈希值
     */
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

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
}

export default ConflictDetector;
