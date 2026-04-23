import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import OfflineQueue from '../OfflineQueue';
import { resetStorageManager, getStorageManager } from '../../storage/StorageManager';

/**
 * Property Tests for Offline Queue
 *
 * These tests verify the correctness properties defined in the testing strategy:
 * - Property 5: Offline queue order preservation
 * - Property 14: Queue consistency
 * - Property 15: No data loss on reconnect
 */

/**
 * Mock storage for testing queue operations
 */
class MockStorage {
  constructor() {
    this.operations = [];
    this.shouldFail = false;
  }

  async initialize() {
    // No-op for mock
  }

  async enqueueOperation(op) {
    if (this.shouldFail) {
      throw new Error('Storage failure');
    }
    // Update if exists, otherwise add
    const existingIndex = this.operations.findIndex(o => o.id === op.id);
    if (existingIndex >= 0) {
      this.operations[existingIndex] = op;
    } else {
      this.operations.push(op);
    }
  }

  async dequeueOperations() {
    return [...this.operations];
  }

  async removeOperation(id) {
    this.operations = this.operations.filter(op => op.id !== id);
  }

  async clearQueue() {
    this.operations = [];
  }

  async close() {
    // No-op
  }
}

describe('Offline Queue Property Tests', () => {
  let queue;
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    queue = new OfflineQueue(mockStorage);
  });

  afterEach(async () => {
    if (queue) {
      await queue.clearQueue();
    }
    mockStorage.operations = [];
  });

  /**
   * Property 5: Offline Queue Order Preservation
   *
   * Operations in the offline queue should be processed in the exact order
   * they were enqueued, ensuring user intent is preserved during sync.
   */
  describe('Property 5: Offline Queue Order Preservation', () => {
    it('should process operations in FIFO order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constant('update'),
              data: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (operations) => {
            // Clear queue before each property run
            await queue.clearQueue();

            // Enqueue all operations
            const ids = [];
            for (const op of operations) {
              const id = await queue.enqueue(op);
              ids.push(id);
            }

            // Process and track order
            const processedOrder = [];
            await queue.processQueue(async (op) => {
              processedOrder.push(op.data);
              return true;
            });

            // Verify order matches input
            const expectedOrder = operations.map(op => op.data);
            expect(processedOrder).toEqual(expectedOrder);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain order when some operations fail', async () => {
      const operations = [
        { type: 'update', data: 'first' },
        { type: 'update', data: 'second' },
        { type: 'update', data: 'third' },
      ];

      for (const op of operations) {
        await queue.enqueue(op);
      }

      // Process where middle operation fails
      const processedOrder = [];
      await queue.processQueue(async (op) => {
        if (op.data === 'second') {
          return false; // Fail
        }
        processedOrder.push(op.data);
        return true;
      });

      // First and third should be processed, second should fail and be retried
      expect(processedOrder).toEqual(['first', 'third']);

      // Second should still be in queue (for retry)
      const remaining = await queue.getAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].data).toBe('second');
    });
  });

  /**
   * Property 14: Queue Consistency
   *
   * The queue state should remain consistent across enqueue/dequeue operations.
   * After any sequence of operations, the queue should accurately reflect
   * all unprocessed operations.
   */
  describe('Property 14: Queue Consistency', () => {
    it('should maintain accurate queue size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constant('update'),
              data: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { maxLength: 20 }
          ),
          async (operations) => {
            // Clear queue before each property run
            await queue.clearQueue();

            // Enqueue operations
            for (const op of operations) {
              await queue.enqueue(op);
            }

            // Check queue size matches
            const size = await queue.getQueueSize();
            expect(size).toBe(operations.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should reflect queue size after partial processing', async () => {
      const operations = [
        { type: 'update', data: 'a' },
        { type: 'update', data: 'b' },
        { type: 'update', data: 'c' },
      ];

      for (const op of operations) {
        await queue.enqueue(op);
      }

      // Process only first two
      let count = 0;
      await queue.processQueue(async (op) => {
        count++;
        return count < 2; // Process first, fail second, leave third
      });

      // After processing with failures, queue should still have remaining
      const remainingSize = await queue.getQueueSize();
      expect(remainingSize).toBeGreaterThanOrEqual(1);
    });

    it('should return all queued operations', async () => {
      const operations = [
        { type: 'update', data: 'first' },
        { type: 'update', data: 'second' },
      ];

      for (const op of operations) {
        await queue.enqueue(op);
      }

      const allOps = await queue.getAll();
      expect(allOps.length).toBe(2);
      expect(allOps.map(o => o.data)).toEqual(['first', 'second']);
    });
  });

  /**
   * Property 15: No Data Loss on Reconnect
   *
   * All data queued during offline mode should be preserved and available
   * for processing after reconnection. No operations should be lost.
   */
  describe('Property 15: No Data Loss on Reconnect', () => {
    it('should preserve all operations after clear and re-enqueue', async () => {
      const originalOps = [
        { type: 'update', data: 'important-data-1' },
        { type: 'update', data: 'important-data-2' },
        { type: 'update', data: 'important-data-3' },
      ];

      // Enqueue original operations
      for (const op of originalOps) {
        await queue.enqueue(op);
      }

      // Get operations (simulating storage read on reconnect)
      const storedOps = await queue.getAll();

      // Verify all operations are preserved
      expect(storedOps.length).toBe(originalOps.length);
      expect(storedOps.map(o => o.data)).toEqual(originalOps.map(o => o.data));
    });

    it('should preserve operation metadata (timestamp, retries)', async () => {
      const op = { type: 'update', data: 'test' };
      const id = await queue.enqueue(op);

      const storedOps = await queue.getAll();
      expect(storedOps[0].id).toBe(id);
      expect(storedOps[0].timestamp).toBeDefined();
      expect(storedOps[0].retries).toBe(0);
    });

    it('should handle multiple enqueue/dequeue cycles without data loss', async () => {
      const cycles = 5;
      const opsPerCycle = 3;

      for (let cycle = 0; cycle < cycles; cycle++) {
        // Enqueue operations
        for (let i = 0; i < opsPerCycle; i++) {
          await queue.enqueue({ type: 'update', data: `cycle-${cycle}-op-${i}` });
        }

        // Process all
        const result = await queue.processQueue(async () => true);

        expect(result.processed).toBe(opsPerCycle);
      }

      // Final queue should be empty
      const finalSize = await queue.getQueueSize();
      expect(finalSize).toBe(0);
    });

    it('should preserve operations after failed processing attempts', async () => {
      const operations = [
        { type: 'update', data: 'persistent-1' },
        { type: 'update', data: 'persistent-2' },
      ];

      for (const op of operations) {
        await queue.enqueue(op);
      }

      // Attempt processing that fails
      await queue.processQueue(async () => false);

      // Operations should still exist (retried)
      const remaining = await queue.getAll();
      expect(remaining.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * Additional: Queue Status Tests
   */
  describe('Queue Status', () => {
    it('should track processing state', async () => {
      await queue.enqueue({ type: 'update', data: 'test' });

      const statusBefore = await queue.getStatus();
      expect(statusBefore.isProcessing).toBe(false);

      // Start processing (will complete immediately since we await)
      await queue.processQueue(async () => true);

      const statusAfter = await queue.getStatus();
      expect(statusAfter.isProcessing).toBe(false);
    });

    it('should report accurate status', async () => {
      const operations = [
        { type: 'update', data: 'a' },
        { type: 'update', data: 'b' },
      ];

      for (const op of operations) {
        await queue.enqueue(op);
      }

      const status = await queue.getStatus();
      expect(status.size).toBe(2);
      expect(status.operations.length).toBe(2);
      expect(status.operations[0]).toHaveProperty('id');
      expect(status.operations[0]).toHaveProperty('type');
      expect(status.operations[0]).toHaveProperty('timestamp');
    });
  });

  /**
   * Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle empty queue gracefully', async () => {
      const size = await queue.getQueueSize();
      expect(size).toBe(0);

      const result = await queue.processQueue(async () => true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should handle single operation queue', async () => {
      await queue.enqueue({ type: 'update', data: 'solo' });

      const result = await queue.processQueue(async () => true);
      expect(result.processed).toBe(1);

      const size = await queue.getQueueSize();
      expect(size).toBe(0);
    });

    it('should respect max retries', async () => {
      queue.maxRetries = 2;

      await queue.enqueue({ type: 'update', data: 'flaky' });

      // Fail twice
      await queue.processQueue(async () => false);
      await queue.processQueue(async () => false);

      // Should be removed after max retries
      const size = await queue.getQueueSize();
      expect(size).toBe(0);
    });

    it('should clear queue completely', async () => {
      for (let i = 0; i < 5; i++) {
        await queue.enqueue({ type: 'update', data: `op-${i}` });
      }

      await queue.clearQueue();

      const size = await queue.getQueueSize();
      expect(size).toBe(0);
    });
  });
});
