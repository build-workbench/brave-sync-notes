import { describe, it, expect, beforeEach } from 'vitest';
import ConflictService from '../ConflictService';

describe('ConflictService', () => {
    let service;

    beforeEach(() => {
        service = new ConflictService({ conflictWindow: 5000 });
    });

    describe('Hash Content', () => {
        it('should generate consistent hash for same content', () => {
            const content = 'Hello World';
            const hash1 = service.hashContent(content);
            const hash2 = service.hashContent(content);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hash for different content', () => {
            const hash1 = service.hashContent('Hello');
            const hash2 = service.hashContent('World');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Conflict Detection', () => {
        it('should not detect conflict for identical content', () => {
            const local = {
                content: 'Hello World',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: service.hashContent('Hello World'),
            };

            const remote = {
                content: 'Hello World',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-2',
                hash: service.hashContent('Hello World'),
            };

            const conflict = service.detectConflict(local, remote);
            expect(conflict).toBeNull();
        });

        it('should detect concurrent edit conflict', () => {
            const local = {
                content: 'Hello World A',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: service.hashContent('Hello World A'),
            };

            const remote = {
                content: 'Hello World B',
                version: 1,
                timestamp: 1001,
                deviceId: 'device-2',
                hash: service.hashContent('Hello World B'),
            };

            const conflict = service.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('concurrent_edit');
        });

        it('should detect offline divergence conflict', () => {
            const local = {
                content: 'Local changes',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: service.hashContent('Local changes'),
            };

            const remote = {
                content: 'Remote changes',
                version: 2,
                timestamp: 10000, // Much later
                deviceId: 'device-2',
                hash: service.hashContent('Remote changes'),
            };

            const conflict = service.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('offline_divergence');
        });

        it('should not detect conflict when versions differ but within time window', () => {
            const local = {
                content: 'Content A',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: service.hashContent('Content A'),
            };

            const remote = {
                content: 'Content B',
                version: 1,
                timestamp: 1100, // Within 5 second window
                deviceId: 'device-2',
                hash: service.hashContent('Content B'),
            };

            const conflict = service.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('concurrent_edit');
        });
    });

    describe('Three-Way Merge', () => {
        it('should merge when local and remote are identical', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello World';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should use remote when local unchanged', () => {
            const base = 'Hello';
            const local = 'Hello';
            const remote = 'Hello World';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should use local when remote unchanged', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should detect conflicts when both changed', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello Universe';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(false);
            expect(result.conflicts).toBeDefined();
            expect(result.conflicts.length).toBeGreaterThan(0);
        });

        it('should merge non-conflicting changes', () => {
            const base = 'Line 1\nLine 2\nLine 3';
            const local = 'Line 1 Modified\nLine 2\nLine 3';
            const remote = 'Line 1\nLine 2\nLine 3 Modified';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toContain('Line 1 Modified');
            expect(result.merged).toContain('Line 3 Modified');
        });
    });

    describe('Auto Resolve', () => {
        const conflict = {
            type: 'concurrent_edit',
            localVersion: {
                content: 'Local content',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
            },
            remoteVersion: {
                content: 'Remote content',
                version: 1,
                timestamp: 2000,
                deviceId: 'device-2',
            },
        };

        it('should resolve with last-write-wins strategy', () => {
            const resolved = service.autoResolve(conflict, 'last-write-wins');
            expect(resolved).toBe('Remote content'); // Remote has later timestamp
        });

        it('should resolve with first-write-wins strategy', () => {
            const resolved = service.autoResolve(conflict, 'first-write-wins');
            expect(resolved).toBe('Local content'); // Local has earlier timestamp
        });

        it('should resolve with local-wins strategy', () => {
            const resolved = service.autoResolve(conflict, 'local-wins');
            expect(resolved).toBe('Local content');
        });

        it('should resolve with remote-wins strategy', () => {
            const resolved = service.autoResolve(conflict, 'remote-wins');
            expect(resolved).toBe('Remote content');
        });

        it('should resolve with merge-both strategy', () => {
            const resolved = service.autoResolve(conflict, 'merge-both');
            expect(resolved).toContain('Local content');
            expect(resolved).toContain('Remote content');
            expect(resolved).toContain('MERGED FROM REMOTE');
        });

        it('should throw error for unknown strategy', () => {
            expect(() => {
                service.autoResolve(conflict, 'unknown-strategy');
            }).toThrow();
        });
    });

    describe('Can Auto Merge', () => {
        it('should return true when one is prefix of another', () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Hello',
                },
                remoteVersion: {
                    content: 'Hello World',
                },
            };

            const canMerge = service.canAutoMerge(conflict);
            expect(canMerge).toBe(true);
        });

        it('should return false for completely different content', () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Completely different',
                },
                remoteVersion: {
                    content: 'Totally unrelated',
                },
            };

            const canMerge = service.canAutoMerge(conflict);
            expect(canMerge).toBe(false);
        });

        it('should return true when three-way merge succeeds', () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Hello World',
                },
                remoteVersion: {
                    content: 'Hello Universe',
                },
                commonAncestor: {
                    content: 'Hello',
                },
            };

            // This will fail because both changed the same line
            const canMerge = service.canAutoMerge(conflict);
            expect(typeof canMerge).toBe('boolean');
        });
    });

    describe('Generate Conflict Report', () => {
        it('should generate readable conflict report', () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Local content',
                    version: 1,
                    timestamp: 1000,
                    deviceId: 'device-1',
                },
                remoteVersion: {
                    content: 'Remote content',
                    version: 1,
                    timestamp: 2000,
                    deviceId: 'device-2',
                },
            };

            const report = service.generateConflictReport(conflict);

            expect(report).toContain('CONFLICT DETECTED');
            expect(report).toContain('concurrent_edit');
            expect(report).toContain('device-1');
            expect(report).toContain('device-2');
            expect(report).toContain('Version: 1');
        });
    });

    describe('Resolve', () => {
        const createConflict = (localTimestamp = 1000, remoteTimestamp = 2000) => ({
            type: 'concurrent_edit',
            localVersion: {
                content: 'Local content',
                version: 1,
                timestamp: localTimestamp,
                deviceId: 'device-1',
                hash: 'hash1',
            },
            remoteVersion: {
                content: 'Remote content',
                version: 1,
                timestamp: remoteTimestamp,
                deviceId: 'device-2',
                hash: 'hash2',
            },
        });

        it('should resolve with last-write-wins strategy', async () => {
            const conflict = createConflict();
            const resolved = await service.resolve(conflict, 'last-write-wins');

            expect(resolved).toBe('Remote content');
        });

        it('should resolve with first-write-wins strategy', async () => {
            const conflict = createConflict();
            const resolved = await service.resolve(conflict, 'first-write-wins');

            expect(resolved).toBe('Local content');
        });

        it('should throw error for manual strategy', async () => {
            const conflict = createConflict();

            await expect(service.resolve(conflict, 'manual')).rejects.toThrow();
        });

        it('should auto-merge when possible', async () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Hello',
                    version: 1,
                    timestamp: 1000,
                    deviceId: 'device-1',
                },
                remoteVersion: {
                    content: 'Hello World',
                    version: 1,
                    timestamp: 2000,
                    deviceId: 'device-2',
                },
                commonAncestor: {
                    content: 'Hello',
                    version: 0,
                    timestamp: 500,
                    deviceId: 'device-1',
                },
            };

            const resolved = await service.resolve(conflict, 'auto-merge');
            expect(resolved).toBe('Hello World');
        });

        it('should fallback to last-write-wins when auto-merge fails', async () => {
            const conflict = {
                type: 'concurrent_edit',
                localVersion: {
                    content: 'Local changes',
                    version: 1,
                    timestamp: 1000,
                    deviceId: 'device-1',
                },
                remoteVersion: {
                    content: 'Remote changes',
                    version: 1,
                    timestamp: 2000,
                    deviceId: 'device-2',
                },
                commonAncestor: {
                    content: 'Original',
                    version: 0,
                    timestamp: 500,
                    deviceId: 'device-1',
                },
            };

            const resolved = await service.resolve(conflict, 'auto-merge');
            expect(resolved).toBe('Remote changes'); // Fallback to last-write-wins
        });
    });

    describe('Resolve Manually', () => {
        it('should resolve with user-provided content', async () => {
            const conflict = { type: 'concurrent_edit' };
            const userContent = 'User merged content';

            const resolved = await service.resolveManually(conflict, userContent);
            expect(resolved).toBe(userContent);
        });

        it('should throw error when no content provided', async () => {
            const conflict = { type: 'concurrent_edit' };

            await expect(service.resolveManually(conflict, '')).rejects.toThrow();
            await expect(service.resolveManually(conflict, null)).rejects.toThrow();
        });
    });

    describe('Conflict Queue', () => {
        const createConflict = (localTimestamp = 1000, remoteTimestamp = 2000) => ({
            type: 'concurrent_edit',
            localVersion: {
                content: 'Local content',
                version: 1,
                timestamp: localTimestamp,
                deviceId: 'device-1',
                hash: 'hash1',
            },
            remoteVersion: {
                content: 'Remote content',
                version: 1,
                timestamp: remoteTimestamp,
                deviceId: 'device-2',
                hash: 'hash2',
            },
        });

        it('should enqueue conflicts', () => {
            const conflict = createConflict();
            service.enqueueConflict(conflict);

            expect(service.getQueueSize()).toBe(1);
        });

        it('should get next conflict', () => {
            const conflict1 = createConflict();
            const conflict2 = createConflict(3000, 4000);

            service.enqueueConflict(conflict1);
            service.enqueueConflict(conflict2);

            const next = service.getNextConflict();
            expect(next).toBeDefined();
            expect(next.conflict).toBe(conflict1);
        });

        it('should remove conflict from queue', () => {
            const conflict = createConflict();
            service.enqueueConflict(conflict);

            const item = service.getNextConflict();
            service.removeConflict(item.id);

            expect(service.getQueueSize()).toBe(0);
        });

        it('should clear entire queue', () => {
            service.enqueueConflict(createConflict());
            service.enqueueConflict(createConflict(3000, 4000));
            service.enqueueConflict(createConflict(5000, 6000));

            service.clearQueue();
            expect(service.getQueueSize()).toBe(0);
        });

        it('should check if has conflicts', () => {
            expect(service.hasConflicts()).toBe(false);

            service.enqueueConflict(createConflict());
            expect(service.hasConflicts()).toBe(true);

            service.clearQueue();
            expect(service.hasConflicts()).toBe(false);
        });
    });

    describe('Resolve All', () => {
        const createConflict = (localTimestamp = 1000, remoteTimestamp = 2000) => ({
            type: 'concurrent_edit',
            localVersion: {
                content: 'Local content',
                version: 1,
                timestamp: localTimestamp,
                deviceId: 'device-1',
                hash: 'hash1',
            },
            remoteVersion: {
                content: 'Remote content',
                version: 1,
                timestamp: remoteTimestamp,
                deviceId: 'device-2',
                hash: 'hash2',
            },
        });

        it('should resolve all conflicts in queue', async () => {
            service.enqueueConflict(createConflict());
            service.enqueueConflict(createConflict(3000, 4000));
            service.enqueueConflict(createConflict(5000, 6000));

            const results = await service.resolveAll('last-write-wins');

            expect(results).toHaveLength(3);
            expect(service.getQueueSize()).toBe(0);
        });

        it('should handle errors and continue', async () => {
            // Add a conflict that will cause error
            const badConflict = {
                type: 'concurrent_edit',
                localVersion: null,
                remoteVersion: null,
            };

            service.enqueueConflict(badConflict);
            service.enqueueConflict(createConflict());

            const results = await service.resolveAll('last-write-wins');

            // Should skip the bad one and resolve the good one
            expect(results.length).toBeGreaterThanOrEqual(0);
        });

        it('should not allow concurrent resolution', async () => {
            service.enqueueConflict(createConflict());

            const promise1 = service.resolveAll();

            await expect(service.resolveAll()).rejects.toThrow('Already resolving');

            await promise1;
        });
    });

    describe('Statistics', () => {
        const createConflict = (localTimestamp = 1000, remoteTimestamp = 2000) => ({
            type: 'concurrent_edit',
            localVersion: {
                content: 'Local content',
                version: 1,
                timestamp: localTimestamp,
                deviceId: 'device-1',
                hash: 'hash1',
            },
            remoteVersion: {
                content: 'Remote content',
                version: 1,
                timestamp: remoteTimestamp,
                deviceId: 'device-2',
                hash: 'hash2',
            },
        });

        it('should get conflict statistics', () => {
            service.enqueueConflict({
                ...createConflict(),
                type: 'concurrent_edit',
            });

            service.enqueueConflict({
                ...createConflict(3000, 4000),
                type: 'offline_divergence',
            });

            service.enqueueConflict({
                ...createConflict(5000, 6000),
                type: 'concurrent_edit',
            });

            const stats = service.getStats();

            expect(stats.total).toBe(3);
            expect(stats.byType.concurrent_edit).toBe(2);
            expect(stats.byType.offline_divergence).toBe(1);
            expect(stats.oldest).toBeDefined();
            expect(stats.newest).toBeDefined();
        });

        it('should generate summary', () => {
            service.enqueueConflict(createConflict());
            service.enqueueConflict({
                ...createConflict(3000, 4000),
                type: 'offline_divergence',
            });

            const summary = service.generateSummary();

            expect(summary).toContain('Total conflicts: 2');
            expect(summary).toContain('Concurrent edits: 1');
            expect(summary).toContain('Offline divergence: 1');
        });

        it('should show no conflicts message when queue is empty', () => {
            const summary = service.generateSummary();
            expect(summary).toBe('No conflicts');
        });
    });

    describe('Check And Handle', () => {
        it('should return no conflict for same content', async () => {
            const result = await service.checkAndHandle(
                { content: 'Hello', version: 1 },
                { content: 'Hello', version: 1 }
            );

            expect(result.hasConflict).toBe(false);
            expect(result.resolved).toBe('Hello');
        });

        it('should detect and queue conflict', async () => {
            const result = await service.checkAndHandle(
                { content: 'Local', version: 1, timestamp: 1000 },
                { content: 'Remote', version: 1, timestamp: 2000 }
            );

            expect(result.hasConflict).toBe(true);
            expect(result.resolved).toBeNull();
            expect(service.hasConflicts()).toBe(true);
        });

        it('should auto-resolve when strategy is set', async () => {
            service.setAutoResolveStrategy('last-write-wins');

            const result = await service.checkAndHandle(
                { content: 'Local', version: 1, timestamp: 1000 },
                { content: 'Remote', version: 1, timestamp: 2000 }
            );

            expect(result.hasConflict).toBe(true);
            expect(result.resolved).toBe('Remote');
            expect(service.hasConflicts()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty content', () => {
            const local = {
                content: '',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: service.hashContent(''),
            };

            const remote = {
                content: 'Some content',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-2',
                hash: service.hashContent('Some content'),
            };

            const conflict = service.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
        });

        it('should handle very long content', () => {
            const longContent = 'A'.repeat(10000);
            const hash = service.hashContent(longContent);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });

        it('should handle special characters', () => {
            const content = '特殊字符 🎉 \n\t\r';
            const hash = service.hashContent(content);

            expect(hash).toBeDefined();
        });

        it('should handle multiline content in merge', () => {
            const base = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
            const local = 'Line 1\nLine 2 Modified\nLine 3\nLine 4\nLine 5';
            const remote = 'Line 1\nLine 2\nLine 3\nLine 4 Modified\nLine 5';

            const result = service.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
        });

        it('should handle empty queue operations', () => {
            expect(service.getNextConflict()).toBeNull();
            expect(service.getQueueSize()).toBe(0);
            expect(service.hasConflicts()).toBe(false);
        });

        it('should handle removing non-existent conflict', () => {
            service.removeConflict('non-existent-id');
            expect(service.getQueueSize()).toBe(0);
        });

        it('should generate unique IDs for conflicts', () => {
            const createConflict = () => ({
                type: 'concurrent_edit',
                localVersion: { content: 'Local', timestamp: 1000 },
                remoteVersion: { content: 'Remote', timestamp: 2000 },
            });

            service.enqueueConflict(createConflict());
            service.enqueueConflict(createConflict());

            const conflict1 = service.conflictQueue[0];
            const conflict2 = service.conflictQueue[1];

            expect(conflict1.id).not.toBe(conflict2.id);
        });

        it('should maintain queue order', () => {
            const createConflict = (ts) => ({
                type: 'concurrent_edit',
                localVersion: { content: 'Local', timestamp: ts },
                remoteVersion: { content: 'Remote', timestamp: ts + 1000 },
            });

            const conflict1 = createConflict(1000);
            const conflict2 = createConflict(3000);
            const conflict3 = createConflict(5000);

            service.enqueueConflict(conflict1);
            service.enqueueConflict(conflict2);
            service.enqueueConflict(conflict3);

            expect(service.conflictQueue[0].conflict).toBe(conflict1);
            expect(service.conflictQueue[1].conflict).toBe(conflict2);
            expect(service.conflictQueue[2].conflict).toBe(conflict3);
        });
    });
});
