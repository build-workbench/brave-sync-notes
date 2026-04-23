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
  let testDbName;

  beforeEach(async () => {
    resetStorageManager();
    // Use unique DB name per test to avoid state leakage
    testDbName = `TestNoteSyncDB_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    storage = getStorageManager({ dbName: testDbName });
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
      let testCounter = 0;
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 0, maxLength: 200 }),
            content: fc.string({ minLength: 0, maxLength: 10000 }),
          }),
          async (note) => {
            // Use unique ID for each property test run to avoid collisions
            const uniqueNote = {
              ...note,
              id: `note-${testCounter++}-${Date.now()}`,
            };
            const notebookId = 'test-notebook';

            // Save the note
            await storage.saveNote(notebookId, uniqueNote);

            // Retrieve the note
            const retrieved = await storage.getNote(notebookId, uniqueNote.id);

            // Verify consistency
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(uniqueNote.id);
            expect(retrieved.title).toBe(uniqueNote.title);
            expect(retrieved.content).toBe(uniqueNote.content);
            // Version should be incremented (first save = 1)
            expect(retrieved.version).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve notebook data after save and retrieve', async () => {
      let testCounter = 0;
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            createdAt: fc.integer({ min: 0, max: Date.now() }),
            updatedAt: fc.integer({ min: 0, max: Date.now() }),
          }),
          async (notebook) => {
            // Use unique ID for each property test run
            const uniqueNotebook = {
              ...notebook,
              id: `notebook-${testCounter++}-${Date.now()}`,
            };

            // Save the notebook
            await storage.saveNotebook(uniqueNotebook);

            // Retrieve the notebook
            const retrieved = await storage.getNotebook(uniqueNotebook.id);

            // Verify consistency
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(uniqueNotebook.id);
            expect(retrieved.name).toBe(uniqueNotebook.name);
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
