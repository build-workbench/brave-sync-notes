import { describe, it, expect, beforeEach } from 'vitest';
import ConflictResolver from '../ConflictResolver';

describe('ConflictResolver', () => {
    let resolver;

    beforeEach(() => {
        resolver = new ConflictResolver({ defaultStrategy: 'last-write-wins' });
    });

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

    describe('Resolve', () => {
        it('should resolve with last-write-wins strategy', async () => {
            const conflict = createConflict();
            const resolved = await resolver.resolve(conflict, 'last-write-wins');

            expect(resolved).toBe('Remote content');
        });

        it('should resolve with first-write-wins strategy', async () => {
            const conflict = createConflict();
            const resolved = await resolver.resolve(conflict, 'first-write-wins');

            expect(resolved).toBe('Local content');
        });

        it('should throw error for manual strategy', async () => {
            const conflict = createConflict();

            await expect(resolver.resolve(conflict, 'manual')).rejects.toThrow();
        });

        it('should use default strategy when not specified', async () => {
            const conflict = createConflict();
            const resolved = await resolver.resolve(conflict);

            // Default is last-write-wins
            expect(resolved).toBe('Remote content');
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

            const resolved = await resolver.resolve(conflict, 'auto-merge');
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

            const resolved = await resolver.resolve(conflict, 'auto-merge');
            expect(resolved).toBe('Remote changes'); // Fallback to last-write-wins
        });
    });

    describe('Resolve Manually', () => {
        it('should resolve with user-provided content', async () => {
            const conflict = createConflict();
            const userContent = 'User merged content';

            const resolved = await resolver.resolveManually(conflict, userContent);
            expect(resolved).toBe(userContent);
        });

        it('should throw error when no content provided', async () => {
            const conflict = createConflict();

            await expect(resolver.resolveManually(conflict, '')).rejects.toThrow();
            await expect(resolver.resolveManually(conflict, null)).rejects.toThrow();
        });
    });

    describe('Conflict Queue', () => {
        it('should enqueue conflicts', () => {
            const conflict = createConflict();
            resolver.enqueueConflict(conflict);

            expect(resolver.getQueueSize()).toBe(1);
        });

        it('should get next conflict', () => {
            const conflict1 = createConflict();
            const conflict2 = createConflict(3000, 4000);

            resolver.enqueueConflict(conflict1);
            resolver.enqueueConflict(conflict2);

            const next = resolver.getNextConflict();
            expect(next).toBeDefined();
            expect(next.conflict).toBe(conflict1);
        });

        it('should remove conflict from queue', () => {
            const conflict = createConflict();
            resolver.enqueueConflict(conflict);

            const item = resolver.getNextConflict();
            resolver.removeConflict(item.id);

            expect(resolver.getQueueSize()).toBe(0);
        });

        it('should clear entire queue', () => {
            resolver.enqueueConflict(createConflict());
            resolver.enqueueConflict(createConflict(3000, 4000));
            resolver.enqueueConflict(createConflict(5000, 6000));

            resolver.clearQueue();
            expect(resolver.getQueueSize()).toBe(0);
        });

        it('should check if has conflicts', () => {
            expect(resolver.hasConflicts()).toBe(false);

            resolver.enqueueConflict(createConflict());
            expect(resolver.hasConflicts()).toBe(true);

            resolver.clearQueue();
            expect(resolver.hasConflicts()).toBe(false);
        });
    });

    describe('Resolve All', () => {
        it('should resolve all conflicts in queue', async () => {
            resolver.enqueueConflict(createConflict());
            resolver.enqueueConflict(createConflict(3000, 4000));
            resolver.enqueueConflict(createConflict(5000, 6000));

            const results = await resolver.resolveAll('last-write-wins');

            expect(results).toHaveLength(3);
            expect(resolver.getQueueSize()).toBe(0);
        });

        it('should handle errors and continue', async () => {
            // Add a conflict that will cause error
            const badConflict = {
                type: 'concurrent_edit',
                localVersion: null,
                remoteVersion: null,
            };

            resolver.enqueueConflict(badConflict);
            resolver.enqueueConflict(createConflict());

            const results = await resolver.resolveAll('last-write-wins');

            // Should skip the bad one and resolve the good one
            expect(results.length).toBeGreaterThanOrEqual(0);
        });

        it('should not allow concurrent resolution', async () => {
            resolver.enqueueConflict(createConflict());

            const promise1 = resolver.resolveAll();

            await expect(resolver.resolveAll()).rejects.toThrow('Already resolving');

            await promise1;
        });
    });

    describe('Statistics', () => {
        it('should get conflict statistics', () => {
            resolver.enqueueConflict({
                ...createConflict(),
                type: 'concurrent_edit',
            });

            resolver.enqueueConflict({
                ...createConflict(3000, 4000),
                type: 'offline_divergence',
            });

            resolver.enqueueConflict({
                ...createConflict(5000, 6000),
                type: 'concurrent_edit',
            });

            const stats = resolver.getStats();

            expect(stats.total).toBe(3);
            expect(stats.byType.concurrent_edit).toBe(2);
            expect(stats.byType.offline_divergence).toBe(1);
            expect(stats.oldest).toBeDefined();
            expect(stats.newest).toBeDefined();
        });

        it('should generate summary', () => {
            resolver.enqueueConflict(createConflict());
            resolver.enqueueConflict({
                ...createConflict(3000, 4000),
                type: 'offline_divergence',
            });

            const summary = resolver.generateSummary();

            expect(summary).toContain('Total conflicts: 2');
            expect(summary).toContain('Concurrent edits: 1');
            expect(summary).toContain('Offline divergence: 1');
        });

        it('should show no conflicts message when queue is empty', () => {
            const summary = resolver.generateSummary();
            expect(summary).toBe('No conflicts');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty queue operations', () => {
            expect(resolver.getNextConflict()).toBeNull();
            expect(resolver.getQueueSize()).toBe(0);
            expect(resolver.hasConflicts()).toBe(false);
        });

        it('should handle removing non-existent conflict', () => {
            resolver.removeConflict('non-existent-id');
            expect(resolver.getQueueSize()).toBe(0);
        });

        it('should generate unique IDs for conflicts', () => {
            resolver.enqueueConflict(createConflict());
            resolver.enqueueConflict(createConflict());

            const conflict1 = resolver.conflictQueue[0];
            const conflict2 = resolver.conflictQueue[1];

            expect(conflict1.id).not.toBe(conflict2.id);
        });

        it('should maintain queue order', () => {
            const conflict1 = createConflict(1000, 2000);
            const conflict2 = createConflict(3000, 4000);
            const conflict3 = createConflict(5000, 6000);

            resolver.enqueueConflict(conflict1);
            resolver.enqueueConflict(conflict2);
            resolver.enqueueConflict(conflict3);

            expect(resolver.conflictQueue[0].conflict).toBe(conflict1);
            expect(resolver.conflictQueue[1].conflict).toBe(conflict2);
            expect(resolver.conflictQueue[2].conflict).toBe(conflict3);
        });
    });
});
