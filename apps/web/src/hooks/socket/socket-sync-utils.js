import { encryptData, decryptData } from '../../utils/crypto';
import { hashContent, splitIntoChunks } from '../../utils/sync';

export const emitEncryptedUpdate = async ({
  socket,
  keys,
  content,
  timestamp = Date.now(),
}) => {
  const chunks = splitIntoChunks(content);
  const sessionId = Date.now().toString();

  for (const chunk of chunks) {
    const dataToEncrypt = chunks.length === 1
      ? { content }
      : { chunked: true, sessionId, chunk };

    const encrypted = await encryptData(dataToEncrypt, keys.encryptionKey);

    socket.emit('push-update', {
      roomId: keys.roomId,
      encryptedData: encrypted,
      timestamp,
      chunkIndex: chunk.index,
      totalChunks: chunks.length,
    });
  }

  return hashContent(content);
};

export const processEncryptedSyncPayload = async ({
  payload,
  encryptionKey,
  chunkManager,
  onRemoteContent,
  decrypt = decryptData,
}) => {
  const decrypted = await decrypt(payload.encryptedData, encryptionKey);
  if (!decrypted) {
    return;
  }

  if (decrypted.chunked) {
    const fullContent = chunkManager.reassemble(decrypted.sessionId, decrypted.chunk);
    if (fullContent !== null) {
      await onRemoteContent(fullContent, payload);
    }
    return;
  }

  if (decrypted.content !== undefined) {
    await onRemoteContent(decrypted.content, payload);
  }
};
