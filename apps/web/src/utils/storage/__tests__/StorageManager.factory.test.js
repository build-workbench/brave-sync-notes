import { describe, it, expect } from 'vitest';
import { createStorageManager, default as StorageManager } from '../StorageManager';

describe('StorageManager factory', () => {
  it('creates independent storage manager instances', () => {
    const first = createStorageManager({ dbName: 'db-a' });
    const second = createStorageManager({ dbName: 'db-b' });

    expect(first).toBeInstanceOf(StorageManager);
    expect(second).toBeInstanceOf(StorageManager);
    expect(first).not.toBe(second);
    expect(first.options.dbName).toBe('db-a');
    expect(second.options.dbName).toBe('db-b');
  });
});
