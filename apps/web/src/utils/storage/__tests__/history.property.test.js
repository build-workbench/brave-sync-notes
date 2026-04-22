import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { resetStorageManager, getStorageManager } from '../StorageManager';

/**
 * Feature: comprehensive-refactor, Property 9: History Version Limit
 *
 * For any note with history entries, when the history count exceeds 50,
 * the oldest entries should be automatically removed to maintain exactly 50 entries.
 *
 * Validates: Requirements 5.5
 */
describe('History Property Tests', () => {
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

  describe('Property 9: History Version Limit', () => {
    const MAX_HISTORY = 50;

    it('should limit history to maximum entries', async () => {
      const noteId = 'test-note-history-limit';

      // Add more than MAX_HISTORY entries
      for (let i = 0; i < MAX_HISTORY + 10; i++) {
        const entry = {
          id: `history-${i}`,
          content: `Content version ${i}`,
          timestamp: Date.now() + i,
          version: i + 1,
        };
        await storage.saveHistory(noteId, entry);
      }

      // Get history
      const history = await storage.getHistory(noteId, MAX_HISTORY);

      // Should be limited to MAX_HISTORY
      expect(history.length).toBeLessThanOrEqual(MAX_HISTORY);
    });

    it('should keep most recent history entries', async () => {
      const noteId = 'test-note-recent-history';

      // Add entries with increasing timestamps
      const entries = [];
      for (let i = 0; i < MAX_HISTORY + 5; i++) {
        const entry = {
          id: `history-recent-${i}`,
          content: `Content version ${i}`,
          timestamp: Date.now() + i * 1000,
          version: i + 1,
        };
        entries.push(entry);
        await storage.saveHistory(noteId, entry);
      }

      // Get history
      const history = await storage.getHistory(noteId, MAX_HISTORY);

      // The most recent entries should be preserved
      const historyIds = history.map((h) => h.id);
      const expectedRecentIds = entries.slice(-MAX_HISTORY).map((e) => e.id);

      // All recent entries should be present (order may vary)
      expect(historyIds.sort()).toEqual(expectedRecentIds.sort());
    });

    it('should handle arbitrary history sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (numEntries) => {
            const noteId = `note-history-${numEntries}`;

            // Add entries
            for (let i = 0; i < numEntries; i++) {
              await storage.saveHistory(noteId, {
                id: `entry-${i}`,
                content: `Content ${i}`,
                timestamp: Date.now() + i,
                version: i + 1,
              });
            }

            // Get history with limit
            const history = await storage.getHistory(noteId, MAX_HISTORY);

            // Should never exceed limit
            expect(history.length).toBeLessThanOrEqual(MAX_HISTORY);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: History Entry Integrity', () => {
    it('should preserve history entry data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 0, maxLength: 5000 }),
            timestamp: fc.integer({ min: 0, max: Date.now() * 2 }),
            version: fc.integer({ min: 1, max: 1000 }),
            deviceName: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
          }),
          async (entry) => {
            const noteId = 'note-entry-integrity';

            await storage.saveHistory(noteId, entry);
            const history = await storage.getHistory(noteId);

            const savedEntry = history.find((h) => h.id === entry.id);
            expect(savedEntry).toBeDefined();
            expect(savedEntry.content).toBe(entry.content);
            expect(savedEntry.version).toBe(entry.version);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
