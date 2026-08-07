import { encryptData, decryptData } from '../../utils/crypto';
import { hashContent } from '../../utils/sync';

export const emitEncryptedUpdate = async ({
  socket,
  keys,
  content,
  timestamp = Date.now(),
}) => {
  const encrypted = await encryptData({ content }, keys.encryptionKey);

  socket.emit('push-update', {
    roomId: keys.roomId,
    encryptedData: encrypted,
    timestamp,
  });

  return hashContent(content);
};

export const processEncryptedSyncPayload = async ({
  payload,
  encryptionKey,
  onRemoteContent,
  decrypt = decryptData,
}) => {
  const decrypted = await decrypt(payload.encryptedData, encryptionKey);
  if (!decrypted) {
    return;
  }

  if (decrypted.content !== undefined) {
    await onRemoteContent(decrypted.content, payload);
  }
};
