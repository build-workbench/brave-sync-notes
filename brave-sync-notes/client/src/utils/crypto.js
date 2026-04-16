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
    iterations: PBKDF2_ITERATIONS
  }).toString(CryptoJS.enc.Hex);

  return { roomId, encryptionKey };
};

export const encryptData = (data, key) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

export const decryptData = (ciphertext, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedStr) {
      throw new Error('Decryption returned empty result - invalid key or corrupted data');
    }

    const decryptedData = JSON.parse(decryptedStr);
    return decryptedData;
  } catch (e) {
    console.error("Decryption failed", e);
    // Throw error instead of returning null to prevent silent failures
    throw new Error(`Decryption failed: ${e.message}`);
  }
};

/**
 * Validate mnemonic format (BIP39)
 * @param {string} mnemonic - The mnemonic to validate
 * @returns {boolean} Whether the mnemonic is valid
 */
export const validateMnemonic = (mnemonic) => {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const words = mnemonic.trim().split(/\s+/);
  const validLengths = [12, 15, 18, 21, 24];

  if (!validLengths.includes(words.length)) {
    return false;
  }

  // Each word should be lowercase alphabetic
  return words.every(word => /^[a-z]+$/.test(word));
};

// PBKDF2 iterations - configurable via environment
export const PBKDF2_ITERATIONS = parseInt(import.meta.env.VITE_PBKDF2_ITERATIONS) || 10000;
