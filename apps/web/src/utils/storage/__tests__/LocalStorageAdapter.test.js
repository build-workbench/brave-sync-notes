import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import LocalStorageAdapter from '../LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
    let storage;

    beforeEach(async () => {
        localStorage.clear();
        storage = new LocalStorageAdapter({ prefix: 'test_' });
        await storage.initialize();
    });

    afterEach(async () => {
        await storage.close();
        localStorage.clear();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            expect(storage.isInitialized).toBe(true);
        });

        it('should check availability', async () => {
            const available = await storage.isAvailable();
            expect(available).toBe(true);
        });
    });

    describe('Notebook Operations', () => {
        const testNotebook = {
            id: 'notebook-1',
            name: 'Test Notebook',
            mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
            encryptionKey: 'test-key-123',
            roomId: 'room-123',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        it('should save and retrieve a notebook', async () => {
            await storage.saveNotebook(testNotebook);
            const retrieved = await storage.getNotebook(testNotebook.id);

            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(testNotebook.id);
            expect(retrieved.name).toBe(testNotebook.name);
            expect(retrieved.mnemonic).toBe(testNotebook.mnemonic);
        });

        it('should list all notebooks', async () => {
            await storage.saveNotebook(testNotebook);
            await storage.saveNotebook({ ...testNotebook, id: 'notebook-2', name: 'Notebook 2' });

            const notebooks = await storage.listNotebooks();
            expect(notebooks).toHaveLength(2);
        });

        it('should delete a notebook', async () => {
            await storage.saveNotebook(testNotebook);
            await storage.deleteNotebook(testNotebook.id);

            const retrieved = await storage.getNotebook(testNotebook.id);
            expect(retrieved).toBeNull();
        });

        it('should update notebook timestamp on save', async () => {
            await storage.saveNotebook(testNotebook);

            const firstSave = await storage.getNotebook(testNotebook.id);
            const firstTimestamp = firstSave.updatedAt;

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));

            await storage.saveNotebook({ ...testNotebook, name: 'Updated Name' });
            const secondSave = await storage.getNotebook(testNotebook.id);

            expect(secondSave.updatedAt).toBeGreaterThan(firstTimestamp);
            expect(secondSave.name).toBe('Updated Name');
        });
    });

    describe('Note Operations', () => {
        const notebookId = 'notebook-1';
        const testNote = {
            id: 'note-1',
            title: 'Test Note',
            content: '# Hello World',
            tags: ['test', 'important'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
        };

        beforeEach(async () => {
            await storage.saveNotebook({
                id: notebookId,
                name: 'Test Notebook',
                mnemonic: 'test mnemonic',
                encryptionKey: 'key',
                roomId: 'room',
            });
        });

        it('should save and retrieve a note', async () => {
            await storage.saveNote(notebookId, testNote);
            const retrieved = await storage.getNote(notebookId, testNote.id);

            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(testNote.id);
            expect(retrieved.title).toBe(testNote.title);
            expect(retrieved.content).toBe(testNote.content);
            expect(retrieved.notebookId).toBe(notebookId);
        });

        it('should list notes in a notebook', async () => {
            await storage.saveNote(notebookId, testNote);
            await storage.saveNote(notebookId, { ...testNote, id: 'note-2', title: 'Note 2' });

            const notes = await storage.listNotes(notebookId);
            expect(notes).toHaveLength(2);
        });

        it('should delete a note', async () => {
            await storage.saveNote(notebookId, testNote);
            await storage.deleteNote(notebookId, testNote.id);

            const retrieved = await storage.getNote(notebookId, testNote.id);
            expect(retrieved).toBeNull();
        });

        it('should increment version on save', async () => {
            await storage.saveNote(notebookId, testNote);
            const first = await storage.getNote(notebookId, testNote.id);

            await storage.saveNote(notebookId, { ...testNote, content: 'Updated' });
            const second = await storage.getNote(notebookId, testNote.id);

            expect(second.version).toBe(first.version + 1);
        });

        it('should sort notes by update time', async () => {
            // Save notes with delays to ensure different updatedAt timestamps
            await storage.saveNote(notebookId, { ...testNote, id: 'note-1', title: 'Note 1' });
            await new Promise(resolve => setTimeout(resolve, 10));
            await storage.saveNote(notebookId, { ...testNote, id: 'note-2', title: 'Note 2' });
            await new Promise(resolve => setTimeout(resolve, 10));
            await storage.saveNote(notebookId, { ...testNote, id: 'note-3', title: 'Note 3' });

            const notes = await storage.listNotes(notebookId);
            expect(notes[0].id).toBe('note-3'); // Most recent
            expect(notes[1].id).toBe('note-2');
            expect(notes[2].id).toBe('note-1'); // Oldest
        });
    });

    describe('History Operations', () => {
        const noteId = 'note-1';
        const testHistory = {
            id: 'history-1',
            noteId,
            content: '# Version 1',
            version: 1,
            timestamp: Date.now(),
            deviceName: 'Test Device',
            tags: ['test'],
        };

        it('should save and retrieve history', async () => {
            await storage.saveHistory(noteId, testHistory);
            const history = await storage.getHistory(noteId);

            expect(history).toHaveLength(1);
            expect(history[0].id).toBe(testHistory.id);
            expect(history[0].content).toBe(testHistory.content);
        });

        it('should limit history entries', async () => {
            for (let i = 0; i < 60; i++) {
                await storage.saveHistory(noteId, {
                    ...testHistory,
                    id: `history-${i}`,
                    version: i,
                });
            }

            const history = await storage.getHistory(noteId, 20);
            expect(history.length).toBeLessThanOrEqual(20);
        });

        it('should cleanup old history', async () => {
            // First, add 100 history entries without auto-cleanup
            const storage2 = new LocalStorageAdapter({ prefix: 'test_', maxHistoryPerNote: 200 });
            await storage2.initialize();

            for (let i = 0; i < 100; i++) {
                await storage2.saveHistory(noteId, {
                    ...testHistory,
                    id: `history-${i}`,
                    version: i,
                });
            }

            // Now cleanup to keep only 50
            const deleted = await storage2.cleanupHistory(noteId, 50);
            expect(deleted).toBe(50);

            const remaining = await storage2.getHistory(noteId);
            expect(remaining.length).toBeLessThanOrEqual(50);

            await storage2.close();
        });
    });

    describe('Offline Queue Operations', () => {
        const testOperation = {
            id: 'op-1',
            type: 'update',
            notebookId: 'notebook-1',
            noteId: 'note-1',
            data: { content: 'Updated content' },
            timestamp: Date.now(),
            retries: 0,
        };

        it('should enqueue and dequeue operations', async () => {
            await storage.enqueueOperation(testOperation);
            const ops = await storage.dequeueOperations();

            expect(ops).toHaveLength(1);
            expect(ops[0].id).toBe(testOperation.id);
        });

        it('should remove specific operation', async () => {
            await storage.enqueueOperation(testOperation);
            await storage.removeOperation(testOperation.id);

            const ops = await storage.dequeueOperations();
            expect(ops).toHaveLength(0);
        });

        it('should clear all operations', async () => {
            await storage.enqueueOperation(testOperation);
            await storage.enqueueOperation({ ...testOperation, id: 'op-2' });
            await storage.clearQueue();

            const ops = await storage.dequeueOperations();
            expect(ops).toHaveLength(0);
        });

        it('should sort operations by timestamp', async () => {
            const op1 = { ...testOperation, id: 'op-1', timestamp: 1000 };
            const op2 = { ...testOperation, id: 'op-2', timestamp: 2000 };
            const op3 = { ...testOperation, id: 'op-3', timestamp: 1500 };

            await storage.enqueueOperation(op1);
            await storage.enqueueOperation(op2);
            await storage.enqueueOperation(op3);

            const ops = await storage.dequeueOperations();
            expect(ops[0].id).toBe('op-1');
            expect(ops[1].id).toBe('op-3');
            expect(ops[2].id).toBe('op-2');
        });
    });

    describe('Storage Management', () => {
        it('should get storage usage', async () => {
            const usage = await storage.getStorageUsage();

            expect(usage).toHaveProperty('used');
            expect(usage).toHaveProperty('quota');
            expect(usage).toHaveProperty('percentage');
            expect(usage.used).toBeGreaterThanOrEqual(0);
        });

        it('should cleanup old data', async () => {
            const notebookId = 'notebook-1';

            // Create a storage with higher history limit
            const storage2 = new LocalStorageAdapter({ prefix: 'test2_', maxHistoryPerNote: 200 });
            await storage2.initialize();

            await storage2.saveNotebook({
                id: notebookId,
                name: 'Test',
                mnemonic: 'test',
                encryptionKey: 'key',
                roomId: 'room',
            });

            const noteId = 'note-1';
            await storage2.saveNote(notebookId, {
                id: noteId,
                title: 'Test',
                content: 'Test',
                tags: [],
            });

            // Add many history entries
            for (let i = 0; i < 100; i++) {
                await storage2.saveHistory(noteId, {
                    id: `history-${i}`,
                    noteId,
                    content: `Version ${i}`,
                    version: i,
                    timestamp: Date.now(),
                    deviceName: 'Test',
                    tags: [],
                });
            }

            // Now set a lower limit and cleanup
            storage2.maxHistoryPerNote = 50;
            const freed = await storage2.cleanup();
            expect(freed).toBeGreaterThan(0);

            await storage2.close();
        });
    });

    describe('Error Handling', () => {
        it('should throw error for invalid notebook data', async () => {
            await expect(storage.saveNotebook({})).rejects.toThrow();
            await expect(storage.saveNotebook({ id: 'test' })).rejects.toThrow();
        });

        it('should throw error for invalid note data', async () => {
            await expect(storage.saveNote('notebook-1', {})).rejects.toThrow();
            await expect(storage.saveNote('notebook-1', { id: 'test' })).rejects.toThrow('content or title is required');
        });

        it('should throw error for invalid history data', async () => {
            await expect(storage.saveHistory('note-1', {})).rejects.toThrow();
        });

        it('should throw error for invalid operation data', async () => {
            await expect(storage.enqueueOperation({})).rejects.toThrow();
        });
    });

    describe('Cascade Delete', () => {
        it('should delete all notes when notebook is deleted', async () => {
            const notebookId = 'notebook-1';
            await storage.saveNotebook({
                id: notebookId,
                name: 'Test',
                mnemonic: 'test',
                encryptionKey: 'key',
                roomId: 'room',
            });

            await storage.saveNote(notebookId, {
                id: 'note-1',
                title: 'Note 1',
                content: 'Content 1',
                tags: [],
            });

            await storage.saveNote(notebookId, {
                id: 'note-2',
                title: 'Note 2',
                content: 'Content 2',
                tags: [],
            });

            await storage.deleteNotebook(notebookId);

            const notes = await storage.listNotes(notebookId);
            expect(notes).toHaveLength(0);
        });

        it('should delete history when note is deleted', async () => {
            const notebookId = 'notebook-1';
            const noteId = 'note-1';

            await storage.saveNotebook({
                id: notebookId,
                name: 'Test',
                mnemonic: 'test',
                encryptionKey: 'key',
                roomId: 'room',
            });

            await storage.saveNote(notebookId, {
                id: noteId,
                title: 'Test',
                content: 'Test',
                tags: [],
            });

            await storage.saveHistory(noteId, {
                id: 'history-1',
                noteId,
                content: 'Version 1',
                version: 1,
                timestamp: Date.now(),
                deviceName: 'Test',
                tags: [],
            });

            await storage.deleteNote(notebookId, noteId);

            const history = await storage.getHistory(noteId);
            expect(history).toHaveLength(0);
        });
    });
});
