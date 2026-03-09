import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';

// In a real app, we'd use a better buffer polyfill or the native one
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

export const generateSyncChain = () => {
  // Generate a random 12-word mnemonic
  const mnemonic = bip39.generateMnemonic();
  return mnemonic;
};

export const deriveKeys = (mnemonic) => {
  // 1. Derive Room ID (Public)
  // SHA256 of the mnemonic — server uses this as the room identifier
  // but never sees the mnemonic itself.
  const roomId = CryptoJS.SHA256(mnemonic).toString(CryptoJS.enc.Hex);

  // 2. Derive Encryption Key (Private)
  // Use PBKDF2 with a mnemonic-derived salt for key stretching.
  // The salt is derived from the mnemonic itself via a different hash,
  // ensuring each mnemonic gets a unique salt while remaining deterministic
  // (so all devices with the same mnemonic derive the same key).
  const salt = CryptoJS.SHA256("notesync-salt:" + mnemonic).toString(CryptoJS.enc.Hex);
  const encryptionKey = CryptoJS.PBKDF2(mnemonic, salt, {
    keySize: 256 / 32,
    iterations: 10000
  }).toString(CryptoJS.enc.Hex);

  return { roomId, encryptionKey };
};

export const encryptData = (data, key) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

export const decryptData = (ciphertext, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};
