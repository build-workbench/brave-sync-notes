/**
 * Tests for OfflineQueue
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import OfflineQueue from '../offline-queue';

describe('OfflineQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new OfflineQueue();
  });

  it('enqueues an update', () => {
    const id = queue.enqueue('push-update', { content: 'test' });
    expect(id).toBeDefined();
    expect(queue.size()).toBe(1);
  });

  it('dequeues in FIFO order', () => {
    queue.enqueue('push-update', { content: 'first' });
    queue.enqueue('push-update', { content: 'second' });

    const first = queue.dequeue();
    expect(first.payload.content).toBe('first');
  });

  it('removes an item by id', () => {
    const id = queue.enqueue('push-update', { content: 'test' });
    expect(queue.size()).toBe(1);

    queue.remove(id);
    expect(queue.size()).toBe(0);
  });

  it('tracks retry count', () => {
    const id = queue.enqueue('push-update', { content: 'test' });
    const retries1 = queue.incrementRetry(id);
    const retries2 = queue.incrementRetry(id);

    expect(retries1).toBe(1);
    expect(retries2).toBe(2);
  });

  it('returns all queued items', () => {
    queue.enqueue('push-update', { content: 'first' });
    queue.enqueue('push-update', { content: 'second' });

    const items = queue.getAll();
    expect(items).toHaveLength(2);
    expect(items[0].payload.content).toBe('first');
    expect(items[1].payload.content).toBe('second');
  });

  it('clears entire queue', () => {
    queue.enqueue('push-update', { content: 'test' });
    queue.clear();

    expect(queue.size()).toBe(0);
  });

  it('notifies on changes', () => {
    const callback = vi.fn();
    queue.onChange(callback);

    queue.enqueue('push-update', { content: 'test' });
    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0].action).toBe('add');
  });

  it('unsubscribes from changes', () => {
    const callback = vi.fn();
    const unsubscribe = queue.onChange(callback);

    unsubscribe();
    queue.enqueue('push-update', { content: 'test' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('estimates total size', () => {
    queue.enqueue('push-update', { content: 'test' });
    const size = queue.estimateSize();
    expect(size).toBeGreaterThan(0);
  });

  it('calculates exponential backoff', () => {
    const delay0 = queue.getRetryBackoff(0);
    const delay1 = queue.getRetryBackoff(1);
    const delay2 = queue.getRetryBackoff(2);

    expect(delay1).toBeGreaterThan(delay0);
    expect(delay2).toBeGreaterThan(delay1);
    expect(delay2).toBeLessThanOrEqual(60000); // Max 60s
  });

  it('handles non-existent item removal', () => {
    const removed = queue.remove('non-existent-id');
    expect(removed).toBe(false);
  });

  it('tracks item metadata', () => {
    const id = queue.enqueue('push-update', { content: 'test' });
    const item = queue.dequeue();

    expect(item.id).toBe(id);
    expect(item.event).toBe('push-update');
    expect(item.timestamp).toBeDefined();
    expect(item.retries).toBe(0);
  });
});
