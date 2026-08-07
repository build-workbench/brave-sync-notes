import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../utils/crypto', () => ({
  encryptData: vi.fn(async (data) => 'encrypted:' + JSON.stringify(data)),
  decryptData: vi.fn(async (ct) => JSON.parse(ct.replace('encrypted:', ''))),
}));

import {
  emitEncryptedUpdate,
  processEncryptedSyncPayload,
} from '../socket-sync-utils';

describe('socket-sync-utils', () => {
  it('emitEncryptedUpdate emits a single encrypted push-update', async () => {
    const socket = { emit: vi.fn() };
    const keys = { roomId: 'room-1', encryptionKey: {} };

    const hash = await emitEncryptedUpdate({
      socket,
      keys,
      content: 'hello world',
      timestamp: 12345,
    });

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith(
      'push-update',
      expect.objectContaining({
        roomId: 'room-1',
        encryptedData: expect.stringContaining('"content":"hello world"'),
        timestamp: 12345,
      })
    );
  });

  it('emitEncryptedUpdate sends large content (>50KB) as a single push', async () => {
    const socket = { emit: vi.fn() };
    const keys = { roomId: 'room-1', encryptionKey: {} };
    const bigContent = 'A'.repeat(100 * 1024);

    await emitEncryptedUpdate({ socket, keys, content: bigContent, timestamp: 1 });

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit.mock.calls[0][1].encryptedData).toContain(bigContent.slice(0, 50));
  });

  it('processEncryptedSyncPayload resolves plain content payloads', async () => {
    const payload = {
      encryptedData: 'cipher',
      version: 2,
      timestamp: 200,
      deviceName: 'remote',
    };
    const onRemoteContent = vi.fn().mockResolvedValue(undefined);
    const decrypt = vi.fn().mockResolvedValue({ content: 'remote-content' });

    await processEncryptedSyncPayload({
      payload,
      encryptionKey: 'key',
      onRemoteContent,
      decrypt,
    });

    expect(onRemoteContent).toHaveBeenCalledWith('remote-content', payload);
  });
});
