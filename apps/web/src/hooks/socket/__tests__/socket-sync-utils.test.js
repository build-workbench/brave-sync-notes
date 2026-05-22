import { describe, it, expect, vi } from 'vitest';
import {
  emitEncryptedUpdate,
  processEncryptedSyncPayload,
} from '../socket-sync-utils';

describe('socket-sync-utils', () => {
  it('emitEncryptedUpdate emits encrypted push-update payload(s)', () => {
    const socket = { emit: vi.fn() };
    const keys = { roomId: 'room-1', encryptionKey: 'key-1' };

    const hash = emitEncryptedUpdate({
      socket,
      keys,
      content: 'hello world',
      timestamp: 12345,
    });

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(socket.emit).toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'push-update',
      expect.objectContaining({
        roomId: 'room-1',
        timestamp: 12345,
        chunkIndex: 0,
        totalChunks: expect.any(Number),
      })
    );
  });

  it('processEncryptedSyncPayload resolves plain content payloads', async () => {
    const payload = {
      encryptedData: 'cipher',
      version: 2,
      timestamp: 200,
      deviceName: 'remote',
    };
    const onRemoteContent = vi.fn().mockResolvedValue(undefined);
    const chunkManager = { reassemble: vi.fn() };
    const decrypt = vi.fn().mockReturnValue({ content: 'remote-content' });

    await processEncryptedSyncPayload({
      payload,
      encryptionKey: 'key',
      chunkManager,
      onRemoteContent,
      decrypt,
    });

    expect(onRemoteContent).toHaveBeenCalledWith('remote-content', payload);
    expect(chunkManager.reassemble).not.toHaveBeenCalled();
  });
});
