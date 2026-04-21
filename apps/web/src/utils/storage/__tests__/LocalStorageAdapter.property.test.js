import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import LocalStorageAdapter from '../LocalStorageAdapter';

/**
 * Property-Based Tests for LocalStorageAdapter
 * Feature: comprehensive-refactor
 */
describe('LocalStorageAdapter Property Tests', () => {
    let storage;

    beforeEach(async () => {
        localStorage.clear();
        storage = new LocalStorageAdapter({ prefix: 'pbt_', maxHistoryPerNote: 100 });
        await storage.initialize();
    });

    afterEach(async () => {
        await storage.close();
        localStorage.clear();
    });

    // Arbitrary generators
    const noteIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const notebookIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const contentArb = fc.string({ minLength: 0, maxLength: 10000 });
    const titleArb = fc.string({ minLength: 1, maxLength: 200 });

    const noteArb = fc.record({
        id: noteIdArb,
        title: titleArb,
        content: contentArb,
        tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
    });

    const notebookArb = fc.record({
        id: notebookIdArb,
        name: titleArb,
        mnemonic: fc.string({ minLength: 10, maxLength: 200 }),
        encryptionKey: fc.string({ minLength: 10, maxLength: 100 }),
        roomId: fc.string({ minLength: 5, maxLength: 50 }),
    });

    /**
     * Property 11: 版本号递增正确性
     * For any note save operation, the version number should be incremented by exactly 1
     * Validates: Requirements 7.2
     */
    describe('Property 11: Version Increment Correctness', () => {
        it('should increment version by exactly 1 on each save', async () => {
            await fc.assert(
                fc.asyncProperty(
                    notebookArb,
                    noteArb,
                    fc.integer({ min: 1, max: 10 }),
                    async (notebook, note, saveCount) => {
                        // Setup notebook
                        await storage.saveNotebook(notebook);

                        // Save note multiple times
                        let lastVersion = 0;
                        for (let i = 0; i < saveCount; i++) {
                            await storage.saveNote(notebook.id, {
                                ...note,
                                content: `${note.content} - version ${i}`,
                            });
                            const saved = await storage.getNote(notebook.id, note.id);

                            if (i === 0) {
                                expect(saved.version).toBe(1);
                            } else {
                                expect(saved.version).toBe(lastVersion + 1);
                            }
                            lastVersion = saved.version;
                        }

                        // Cleanup
                        await storage.deleteNotebook(notebook.id);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 12: 数据验证拒绝无效输入
     * For any note object missing required fields, the storage should reject the save
     * Validates: Requirements 7.4
     */
    describe('Property 12: Data Validation Rejects Invalid Input', () => {
        it('should reject notes without id', async () => {
            await fc.assert(
                fc.asyncProperty(
                    notebookArb,
                    contentArb,
                    async (notebook, content) => {
                        await storage.saveNotebook(notebook);

                        await expect(
                            storage.saveNote(notebook.id, { content })
                        ).rejects.toThrow();

                        await storage.deleteNotebook(notebook.id);
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('should reject notes without content or title', async () => {
            await fc.assert(
                fc.asyncProperty(
                    notebookArb,
                    noteIdArb,
                    async (notebook, noteId) => {
                        await storage.saveNotebook(notebook);

                        await expect(
                            storage.saveNote(notebook.id, { id: noteId })
                        ).rejects.toThrow('content or title is required');

                        await storage.deleteNotebook(notebook.id);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    /**
     * Property 1: 存储往返一致性
     * For any valid note, saving and retrieving should produce equivalent content
     * Validates: Requirements 1.3, 1.4
     */
    describe('Property 1: Storage Round-Trip Consistency', () => {
        it('should preserve note content through save/load cycle', async () => {
            await fc.assert(
                fc.asyncProperty(
                    notebookArb,
                    noteArb,
                    async (notebook, note) => {
                        await storage.saveNotebook(notebook);
                        await storage.saveNote(notebook.id, note);

                        const retrieved = await storage.getNote(notebook.id, note.id);

                        expect(retrieved.id).toBe(note.id);
                        expect(retrieved.title).toBe(note.title);
                        expect(retrieved.content).toBe(note.content);
                        expect(retrieved.tags).toEqual(note.tags);
                        expect(retrieved.notebookId).toBe(notebook.id);

                        await storage.deleteNotebook(notebook.id);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 9: 历史版本限制
     * When history exceeds limit, oldest entries should be removed
     * Validates: Requirements 5.5
     */
    describe('Property 9: History Version Limit', () => {
        it('should maintain history within configured limit', async () => {
            const limitedStorage = new LocalStorageAdapter({ prefix: 'pbt2_', maxHistoryPerNote: 10 });
            await limitedStorage.initialize();

            await fc.assert(
                fc.asyncProperty(
                    noteIdArb,
                    fc.integer({ min: 15, max: 30 }),
                    async (noteId, entryCount) => {
                        // Add more entries than the limit
                        for (let i = 0; i < entryCount; i++) {
                            await limitedStorage.saveHistory(noteId, {
                                id: `history-${noteId}-${i}`,
                                content: `Version ${i}`,
                                version: i,
                                timestamp: Date.now() + i,
                                deviceName: 'Test',
                                tags: [],
                            });
                        }

                        const history = await limitedStorage.getHistory(noteId);
                        expect(history.length).toBeLessThanOrEqual(10);
                    }
                ),
                { numRuns: 20 }
            );

            await limitedStorage.close();
        });
    });
});
