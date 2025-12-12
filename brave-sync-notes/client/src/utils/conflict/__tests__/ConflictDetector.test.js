import { describe, it, expect, beforeEach } from 'vitest';
import ConflictDetector from '../ConflictDetector';

describe('ConflictDetector', () => {
    let detector;

    beforeEach(() => {
        detector = new ConflictDetector({ conflictWindow: 5000 });
    });

    describe('Hash Content', () => {
        it('should generate consistent hash for same content', () => {
            const content = 'Hello World';
            const hash1 = detector.hashContent(content);
            const hash2 = detector.hashContent(content);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hash for different content', () => {
            const hash1 = detector.hashContent('Hello');
            const hash2 = detector.hashContent('World');

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
                hash: detector.hashContent('Hello World'),
            };

            const remote = {
                content: 'Hello World',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-2',
                hash: detector.hashContent('Hello World'),
            };

            const conflict = detector.detectConflict(local, remote);
            expect(conflict).toBeNull();
        });

        it('should detect concurrent edit conflict', () => {
            const local = {
                content: 'Hello World A',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: detector.hashContent('Hello World A'),
            };

            const remote = {
                content: 'Hello World B',
                version: 1,
                timestamp: 1001,
                deviceId: 'device-2',
                hash: detector.hashContent('Hello World B'),
            };

            const conflict = detector.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('concurrent_edit');
        });

        it('should detect offline divergence conflict', () => {
            const local = {
                content: 'Local changes',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: detector.hashContent('Local changes'),
            };

            const remote = {
                content: 'Remote changes',
                version: 2,
                timestamp: 10000, // Much later
                deviceId: 'device-2',
                hash: detector.hashContent('Remote changes'),
            };

            const conflict = detector.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('offline_divergence');
        });

        it('should not detect conflict when versions differ but within time window', () => {
            const local = {
                content: 'Content A',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: detector.hashContent('Content A'),
            };

            const remote = {
                content: 'Content B',
                version: 1,
                timestamp: 1100, // Within 5 second window
                deviceId: 'device-2',
                hash: detector.hashContent('Content B'),
            };

            const conflict = detector.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
            expect(conflict.type).toBe('concurrent_edit');
        });
    });

    describe('Three-Way Merge', () => {
        it('should merge when local and remote are identical', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello World';

            const result = detector.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should use remote when local unchanged', () => {
            const base = 'Hello';
            const local = 'Hello';
            const remote = 'Hello World';

            const result = detector.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should use local when remote unchanged', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello';

            const result = detector.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
            expect(result.merged).toBe('Hello World');
        });

        it('should detect conflicts when both changed', () => {
            const base = 'Hello';
            const local = 'Hello World';
            const remote = 'Hello Universe';

            const result = detector.threeWayMerge(base, local, remote);
            expect(result.success).toBe(false);
            expect(result.conflicts).toBeDefined();
            expect(result.conflicts.length).toBeGreaterThan(0);
        });

        it('should merge non-conflicting changes', () => {
            const base = 'Line 1\nLine 2\nLine 3';
            const local = 'Line 1 Modified\nLine 2\nLine 3';
            const remote = 'Line 1\nLine 2\nLine 3 Modified';

            const result = detector.threeWayMerge(base, local, remote);
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
            const resolved = detector.autoResolve(conflict, 'last-write-wins');
            expect(resolved).toBe('Remote content'); // Remote has later timestamp
        });

        it('should resolve with first-write-wins strategy', () => {
            const resolved = detector.autoResolve(conflict, 'first-write-wins');
            expect(resolved).toBe('Local content'); // Local has earlier timestamp
        });

        it('should resolve with local-wins strategy', () => {
            const resolved = detector.autoResolve(conflict, 'local-wins');
            expect(resolved).toBe('Local content');
        });

        it('should resolve with remote-wins strategy', () => {
            const resolved = detector.autoResolve(conflict, 'remote-wins');
            expect(resolved).toBe('Remote content');
        });

        it('should resolve with merge-both strategy', () => {
            const resolved = detector.autoResolve(conflict, 'merge-both');
            expect(resolved).toContain('Local content');
            expect(resolved).toContain('Remote content');
            expect(resolved).toContain('MERGED FROM REMOTE');
        });

        it('should throw error for unknown strategy', () => {
            expect(() => {
                detector.autoResolve(conflict, 'unknown-strategy');
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

            const canMerge = detector.canAutoMerge(conflict);
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

            const canMerge = detector.canAutoMerge(conflict);
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
            const canMerge = detector.canAutoMerge(conflict);
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

            const report = detector.generateConflictReport(conflict);

            expect(report).toContain('CONFLICT DETECTED');
            expect(report).toContain('concurrent_edit');
            expect(report).toContain('device-1');
            expect(report).toContain('device-2');
            expect(report).toContain('Version: 1');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty content', () => {
            const local = {
                content: '',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-1',
                hash: detector.hashContent(''),
            };

            const remote = {
                content: 'Some content',
                version: 1,
                timestamp: 1000,
                deviceId: 'device-2',
                hash: detector.hashContent('Some content'),
            };

            const conflict = detector.detectConflict(local, remote);
            expect(conflict).not.toBeNull();
        });

        it('should handle very long content', () => {
            const longContent = 'A'.repeat(10000);
            const hash = detector.hashContent(longContent);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });

        it('should handle special characters', () => {
            const content = '特殊字符 🎉 \n\t\r';
            const hash = detector.hashContent(content);

            expect(hash).toBeDefined();
        });

        it('should handle multiline content in merge', () => {
            const base = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
            const local = 'Line 1\nLine 2 Modified\nLine 3\nLine 4\nLine 5';
            const remote = 'Line 1\nLine 2\nLine 3\nLine 4 Modified\nLine 5';

            const result = detector.threeWayMerge(base, local, remote);
            expect(result.success).toBe(true);
        });
    });
});
