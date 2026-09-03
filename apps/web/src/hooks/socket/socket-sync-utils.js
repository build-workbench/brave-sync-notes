import { encryptData, decryptData } from '../../utils/crypto';
import {
  hashContent,
  buildAad,
  PROTOCOL_VERSION,
  ACK_TIMEOUT_MS,
  MAX_DATA_SIZE_BYTES,
} from '../../utils/sync/constants';
import { getDeviceId } from '../../utils/sync/device';
import { nextSeq } from '../../utils/sync/seq';

/**
 * 组装并推送 v2 加密信封。
 * 密文通过 AAD 绑定 roomId/deviceId/seq/timestamp,
 * 接收方按同一格式重建 AAD 才能解密。
 * 若未显式传入 seq/deviceId，则自动生成（保证同毫秒单调与稳定设备标识）。
 *
 * 等待服务端 ack 回调确认后才 resolve；超时或服务端拒绝则 reject，
 * 调用方据此决定是否保留离线队列/更新 lastSyncedHash（避免误报已同步）。
 */
export const emitEncryptedUpdate = ({
  socket,
  keys,
  content,
  timestamp = Date.now(),
  seq,
  deviceId,
  timeoutMs = ACK_TIMEOUT_MS,
}) => {
  const envelopeDeviceId = deviceId ?? getDeviceId();
  const envelopeSeq = seq ?? nextSeq(keys.roomId);
  const aad = buildAad(keys.roomId, envelopeDeviceId, envelopeSeq, timestamp);

  return encryptData({ content }, keys.encryptionKey, aad).then((encrypted) => {
    // 加密后预校验大小:超过 5MB 上限直接拒绝,不发送
    if (new TextEncoder().encode(encrypted).length > MAX_DATA_SIZE_BYTES) {
      return Promise.reject(Object.assign(new Error('Data too large'), { code: 'DATA_TOO_LARGE' }));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(Object.assign(new Error('Push update timed out'), { code: 'PUSH_TIMEOUT', recoverable: true }));
      }, timeoutMs);

      socket.emit('push-update', {
        v: PROTOCOL_VERSION,
        roomId: keys.roomId,
        deviceId: envelopeDeviceId,
        seq: envelopeSeq,
        timestamp,
        encryptedData: encrypted,
      }, (ack) => {
        clearTimeout(timer);
        if (ack && ack.success) {
          resolve(hashContent(content));
        } else {
          const code = ack?.code || 'PUSH_REJECTED';
          reject(Object.assign(new Error(`Push rejected: ${code}`), { code, recoverable: true }));
        }
      });
    });
  });
};

const ENVELOPE_DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

/**
 * 校验并解密远端 v2 信封。
 * 仅接受 v === PROTOCOL_VERSION 的信封:legacy(无 v)分支已移除,
 * 防止恶意服务器故意省略 v 字段把客户端降级到无 AAD 路径(重放/回滚)。
 * 不合法的信封直接丢弃。
 */
export const processEncryptedSyncPayload = async ({
  payload,
  encryptionKey,
  onRemoteContent,
  decrypt = decryptData,
}) => {
  if (!payload || typeof payload !== 'object') return;
  if (typeof payload.encryptedData !== 'string' || !payload.encryptedData) return;
  // 非 v2 信封一律丢弃(legacy 无 v / 未知版本)
  if (payload.v !== PROTOCOL_VERSION) return;

  if (typeof payload.roomId !== 'string' || !payload.roomId) return;
  if (
    typeof payload.deviceId !== 'string' ||
    !ENVELOPE_DEVICE_ID_PATTERN.test(payload.deviceId)
  ) {
    return;
  }
  if (!Number.isInteger(payload.seq) || payload.seq < 0) return;
  if (!Number.isInteger(payload.timestamp)) return;

  let decrypted;
  try {
    const aad = buildAad(payload.roomId, payload.deviceId, payload.seq, payload.timestamp);
    decrypted = await decrypt(payload.encryptedData, encryptionKey, aad);
  } catch {
    // AAD 不匹配(篡改/搬运/重放到其他上下文):静默丢弃
    return;
  }
  if (!decrypted) return;

  if (decrypted.content !== undefined) {
    await onRemoteContent(decrypted.content, payload);
  }
};
