import * as bip39 from 'bip39';

// ---------------------------------------------------------------------------
// Synchronous SHA-256 (minimal, no dependencies)
// Used for roomId derivation — keeps createNotebook() synchronous.
// ---------------------------------------------------------------------------

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

function sha256Hex(message) {
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLen);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const dv = new DataView(data.buffer);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const h = (n) => n.toString(16).padStart(8, '0');
  return h(h0) + h(h1) + h(h2) + h(h3) + h(h4) + h(h5) + h(h6) + h(h7);
}

// ---------------------------------------------------------------------------
// Crypto API
// ---------------------------------------------------------------------------

// 低于该值的迭代次数没有实际抗暴力破解意义,环境变量配置不允许突破下限
const MIN_PBKDF2_ITERATIONS = 100000;
const DEFAULT_PBKDF2_ITERATIONS = 310000; // OWASP 2023 对 PBKDF2-HMAC-SHA256 的建议值

const PBKDF2_ITERATIONS = (() => {
  const configured = parseInt(import.meta.env.VITE_PBKDF2_ITERATIONS);
  if (!Number.isFinite(configured)) return DEFAULT_PBKDF2_ITERATIONS;
  return Math.max(configured, MIN_PBKDF2_ITERATIONS);
})();
const encoder = new TextEncoder();

const KEY_CACHE = new Map();
const MAX_CACHE_SIZE = 128;

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const generateSyncChain = () => bip39.generateMnemonic();

export const deriveRoomId = (mnemonic) => sha256Hex(mnemonic);

export const deriveEncryptionKey = async (mnemonic) => {
  // 缓存以 roomId(公开哈希)为键,避免明文助记词长期驻留内存
  const cacheKey = deriveRoomId(mnemonic);
  if (KEY_CACHE.has(cacheKey)) return KEY_CACHE.get(cacheKey);

  const salt = await crypto.subtle.digest('SHA-256', encoder.encode('notesync-salt:' + mnemonic));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(mnemonic), 'PBKDF2', false, ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  if (KEY_CACHE.size >= MAX_CACHE_SIZE) KEY_CACHE.delete(KEY_CACHE.keys().next().value);
  KEY_CACHE.set(cacheKey, key);
  return key;
};

/**
 * 清除派生密钥缓存(断开连接时调用,缩短密钥在内存中的暴露窗口)
 */
export const clearKeyCache = () => {
  KEY_CACHE.clear();
};

export const deriveKeys = async (mnemonic) => ({
  roomId: deriveRoomId(mnemonic),
  encryptionKey: await deriveEncryptionKey(mnemonic),
});

export const encryptData = async (data, key, additionalData) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const params = { name: 'AES-GCM', iv };
  if (additionalData !== undefined) {
    params.additionalData = encoder.encode(additionalData);
  }
  const ciphertext = await crypto.subtle.encrypt(
    params,
    key,
    encoder.encode(JSON.stringify(data)),
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
};

export const decryptData = async (ciphertext, key, additionalData) => {
  try {
    const combined = base64ToBytes(ciphertext);
    const params = { name: 'AES-GCM', iv: combined.slice(0, 12) };
    if (additionalData !== undefined) {
      params.additionalData = encoder.encode(additionalData);
    }
    const decrypted = await crypto.subtle.decrypt(
      params,
      key,
      combined.slice(12),
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    throw new Error(`Decryption failed: ${e.message}`);
  }
};

export const validateMnemonic = (mnemonic) => {
  if (!mnemonic || typeof mnemonic !== 'string') return false;
  const words = mnemonic.trim().split(/\s+/);
  const validLengths = [12, 15, 18, 21, 24];
  if (!validLengths.includes(words.length)) return false;
  if (!words.every((word) => /^[a-z]+$/.test(word))) return false;
  return bip39.validateMnemonic(words.join(' '));
};

export { PBKDF2_ITERATIONS };
