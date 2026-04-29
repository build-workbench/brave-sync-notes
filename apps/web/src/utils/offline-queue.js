/**
 * Offline queue management for sync updates
 */

class OfflineQueue {
  constructor() {
    this.queue = []; // Array of { id, event, payload, timestamp, retries }
    this.listeners = [];
  }

  /**
   * Add an update to the queue
   */
  enqueue(event, payload) {
    const item = {
      id: `${event}-${Date.now()}-${Math.random()}`,
      event,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(item);
    this.notify('add', item);
    return item.id;
  }

  /**
   * Get the next item to retry
   */
  dequeue() {
    if (this.queue.length === 0) return null;
    return this.queue[0];
  }

  /**
   * Mark item as sent successfully
   */
  remove(id) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index >= 0) {
      const removed = this.queue.splice(index, 1)[0];
      this.notify('remove', removed);
      return true;
    }
    return false;
  }

  /**
   * Increment retry count
   */
  incrementRetry(id) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.retries += 1;
      this.notify('retry', item);
      return item.retries;
    }
    return 0;
  }

  /**
   * Get all queued items
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Clear entire queue
   */
  clear() {
    this.queue = [];
    this.notify('clear', null);
  }

  /**
   * Watch for queue changes
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Internal notification
   */
  notify(action, item) {
    this.listeners.forEach((callback) => {
      callback({ action, item, size: this.queue.length });
    });
  }

  /**
   * Calculate total queue size in bytes (estimate)
   */
  estimateSize() {
    return this.queue.reduce((sum, item) => {
      const payloadSize = JSON.stringify(item.payload).length;
      return sum + payloadSize;
    }, 0);
  }

  /**
   * Get retry backoff time (exponential)
   */
  getRetryBackoff(retries) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 60 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
    return delay;
  }
}

export default OfflineQueue;
