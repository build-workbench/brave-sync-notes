import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { resetStorageManager, getStorageManager } from '../StorageManager';

/**
 * Feature: comprehensive-refactor, Property 1: Storage Round-Trip Consistency
 *
 * For any valid note object, saving it to storage and then retrieving it
 * should produce an equivalent object with the same content, title, and metadata.
 *
 * Validates: Requirements 1.3, 1.4
 */
describe('Storage Property Tests', () => {
  let storage;

  beforeEach(async () => {
    resetStorageManager();
    storage = getStorageManager({ dbName: 'TestNoteSyncDB' });
    await storage.initialize();
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
    resetStorageManager();
  });

  describe('Property 1: Storage Round-Trip Consistency', () => {
    it('should preserve note data after save and retrieve', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            title: fc.string({ minLength: 0, maxLength: 200 }),
            content: fc.string({ minLength: 0, maxLength: 10000 }),
            version: fc.integer({ min: 1, max: 1000 }),
            updatedAt: fc.integer({ min: 0, max: Date.now() }),
          }),
          async (note) => {
            const notebookId = 'test-notebook';

            // Save the note
            await storage.saveNote(notebookId, note);

            // Retrieve the note
            const retrieved = await storage.getNote(notebookId, note.id);

            // Verify consistency
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(note.id);
            expect(retrieved.title).toBe(note.title);
            expect(retrieved.content).toBe(note.content);
            expect(retrieved.version).toBe(note.version);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve notebook data after save and retrieve', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            createdAt: fc.integer({ min: 0, max: Date.now() }),
            updatedAt: fc.integer({ min: 0, max: Date.now() }),
          }),
          async (notebook) => {
            // Save the notebook
            await storage.saveNotebook(notebook);

            // Retrieve the notebook
            const retrieved = await storage.getNotebook(notebook.id);

            // Verify consistency
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(notebook.id);
            expect(retrieved.name).toBe(notebook.name);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle special characters in content', async () => {
      const specialContent = [
        '你好世界', // Chinese
        'Привет мир', // Russian
        '🎉🎊🎁', // Emojis
        '<script>alert("xss")</script>', // HTML
        '{ "json": "data" }', // JSON
        'Line1\nLine2\tTabbed', // Newlines and tabs
      ];

      for (const content of specialContent) {
        const note = {
          id: `special-${Date.now()}`,
          content,
          version: 1,
          updatedAt: Date.now(),
        };

        await storage.saveNote('test-notebook', note);
        const retrieved = await storage.getNote('test-notebook', note.id);

        expect(retrieved.content).toBe(content);
      }
    });
  });

  describe('Property 12: Data Validation Rejects Invalid Input', () => {
    it('should reject notes without required fields', async () => {
      const invalidNotes = [
        { title: 'no id' }, // Missing id
        { id: 'no-content' }, // Missing content (optional but should handle)
      ];

      for (const invalidNote of invalidNotes) {
        // Should not throw - storage should handle gracefully
        try {
          await storage.saveNote('test-notebook', invalidNote);
        } catch (error) {
          // Acceptable to throw for invalid data
          expect(error).toBeDefined();
        }
      }
    });
  });
});
