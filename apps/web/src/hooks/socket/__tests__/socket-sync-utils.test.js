import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../utils/crypto', () => ({
  encryptData: vi.fn(async (data, key, aad) => 'encrypted:' + JSON.stringify(data) + ':aad=' + (aad ?? '')),
  decryptData: vi.fn(async (ct, key, aad) => {
    const marker = ':aad=' + (aad ?? '');
    if (!ct.endsWith(marker)) {
      throw new Error('Decryption failed: AAD mismatch');
    }
    return JSON.parse(ct.slice('encrypted:'.length, -marker.length));
  }),
}));

vi.mock('../../../utils/sync/device', () => ({
  getDeviceId: vi.fn(() => 'device-test01'),
}));

import {
  emitEncryptedUpdate,
  processEncryptedSyncPayload,
} from '../socket-sync-utils';
import { buildAad } from '../../../utils/sync/constants';

describe('socket-sync-utils v2 envelope', () => {
  it('emitEncryptedUpdate sends a v2 envelope bound to seq/deviceId', async () => {
    const socket = { emit: vi.fn((event, envelope, ack) => ack?.({ success: true })) };
    const keys = { roomId: 'room-1', encryptionKey: {} };

    const hash = await emitEncryptedUpdate({
      socket,
      keys,
      content: 'hello world',
      timestamp: 12345,
      seq: 42,
      deviceId: 'device-test01',
    });

    expect(typeof hash).toBe('string');
    expect(socket.emit).toHaveBeenCalledTimes(1);

    const [, envelope] = socket.emit.mock.calls[0];
    expect(envelope).toEqual({
      v: 2,
      roomId: 'room-1',
      deviceId: 'device-test01',
      seq: 42,
      timestamp: 12345,
      encryptedData:
        'encrypted:{"content":"hello world"}:aad=' +
        buildAad('room-1', 'device-test01', 42, 12345),
    });
  });

  it('emitEncryptedUpdate falls back to getDeviceId when not provided', async () => {
    const socket = { emit: vi.fn((event, envelope, ack) => ack?.({ success: true })) };
    const keys = { roomId: 'room-1', encryptionKey: {} };

    await emitEncryptedUpdate({ socket, keys, content: 'x', timestamp: 1, seq: 7 });

    const [, envelope] = socket.emit.mock.calls[0];
    expect(envelope.deviceId).toBe('device-test01');
  });

  it('processEncryptedSyncPayload rebuilds AAD from envelope fields and decrypts', async () => {
    const payload = {
      v: 2,
      roomId: 'room-9',
      deviceId: 'device-peer01',
      seq: 5,
      timestamp: 200,
      encryptedData: 'encrypted:{"content":"remote"}:aad=' + buildAad('room-9', 'device-peer01', 5, 200),
    };
    const onRemoteContent = vi.fn().mockResolvedValue(undefined);
    const decrypt = vi.fn(async (_ct, _key, aad) => {
      expect(aad).toBe(buildAad('room-9', 'device-peer01', 5, 200));
      return { content: 'remote' };
    });

    await processEncryptedSyncPayload({
      payload,
      encryptionKey: 'key',
      onRemoteContent,
      decrypt,
    });

    expect(onRemoteContent).toHaveBeenCalledWith('remote', payload);
  });

  it('drops payloads missing v2 envelope fields without invoking the callback', async () => {
    const onRemoteContent = vi.fn();
    const decrypt = vi.fn();

    for (const bad of [
      null,
      {},
      { v: 1, roomId: 'r', deviceId: 'd-device1', seq: 1, timestamp: 1, encryptedData: 'c' },
      { v: 2, roomId: 'r', seq: 1, timestamp: 1, encryptedData: 'c' },
      { v: 2, roomId: 'r', deviceId: 'd-device1', seq: 'x', timestamp: 1, encryptedData: 'c' },
    ]) {
      await processEncryptedSyncPayload({ payload: bad, encryptionKey: 'k', onRemoteContent, decrypt });
    }

    expect(onRemoteContent).not.toHaveBeenCalled();
    expect(decrypt).not.toHaveBeenCalled();
  });

  it('emitEncryptedUpdate rejects when server ack reports failure', async () => {
    const socket = { emit: vi.fn((event, envelope, ack) => ack?.({ success: false, code: 'RATE_LIMIT' })) };
    const keys = { roomId: 'room-1', encryptionKey: {} };

    await expect(
      emitEncryptedUpdate({ socket, keys, content: 'x', timestamp: 1, seq: 1 })
    ).rejects.toMatchObject({ code: 'RATE_LIMIT' });
  });

  it('processEncryptedSyncPayload drops legacy envelopes without v field', async () => {
    const onRemoteContent = vi.fn();
    const decrypt = vi.fn();
    const payload = {
      encryptedData: 'encrypted:{"content":"old"}:aad=',
      timestamp: 1,
    };

    await processEncryptedSyncPayload({ payload, encryptionKey: 'k', onRemoteContent, decrypt });

    expect(onRemoteContent).not.toHaveBeenCalled();
    expect(decrypt).not.toHaveBeenCalled();
  });
});