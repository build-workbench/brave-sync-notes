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
  // We simply hash the mnemonic. Since the server never sees the mnemonic, 
  // it can't reverse this to get the key.
  // We use SHA256.
  const roomId = CryptoJS.SHA256(mnemonic).toString(CryptoJS.enc.Hex);

  // 2. Derive Encryption Key (Private)
  // We use PBKDF2 to stretch the mnemonic into a key.
  // Salt is constant for this demo, but could be part of the protocol.
  const encryptionKey = CryptoJS.PBKDF2(mnemonic, "brave-sync-demo-salt", {
    keySize: 256 / 32,
    iterations: 1000
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
