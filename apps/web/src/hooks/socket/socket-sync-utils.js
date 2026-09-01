import { encryptData, decryptData } from '../../utils/crypto';
import { hashContent, buildAad, PROTOCOL_VERSION } from '../../utils/sync/constants';
import { getDeviceId } from '../../utils/sync/device';
import { nextSeq } from '../../utils/sync/seq';

/**
 * 组装并推送 v2 加密信封。
 * 密文通过 AAD 绑定 roomId/deviceId/seq/timestamp,
 * 接收方按同一格式重建 AAD 才能解密。
 * 若未显式传入 seq/deviceId，则自动生成（保证同毫秒单调与稳定设备标识）。
 */
export const emitEncryptedUpdate = async ({
  socket,
  keys,
  content,
  timestamp = Date.now(),
  seq,
  deviceId,
}) => {
  const envelopeDeviceId = deviceId ?? getDeviceId();
  const envelopeSeq = seq ?? nextSeq(keys.roomId);
  const aad = buildAad(keys.roomId, envelopeDeviceId, envelopeSeq, timestamp);
  const encrypted = await encryptData({ content }, keys.encryptionKey, aad);

  socket.emit('push-update', {
    v: PROTOCOL_VERSION,
    roomId: keys.roomId,
    deviceId: envelopeDeviceId,
    seq: envelopeSeq,
    timestamp,
    encryptedData: encrypted,
  });

  return hashContent(content);
};

const ENVELOPE_DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

/**
 * 校验并解密远端信封; 支持 v2 (带 AAD) 与 legacy (无 v) 两种形态，
 * 后者为存量房间与旧测试的平滑迁移路径，解密时不绑定 AAD。
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

  // v2 分支：严格校验 AAD 上下文
  if (payload.v === PROTOCOL_VERSION) {
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
    return;
  }

  // 显式 v 但版本不匹配：丢弃，避免跨协议误解密
  if (payload.v !== undefined) return;

  // Legacy 分支：无 v 字段的旧密文（存量数据/旧测试），不校验 AAD
  let decrypted;
  try {
    decrypted = await decrypt(payload.encryptedData, encryptionKey);
  } catch {
    return;
  }
  if (!decrypted) return;

  if (decrypted.content !== undefined) {
    await onRemoteContent(decrypted.content, payload);
  }
};
