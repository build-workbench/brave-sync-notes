import { describe, it, expect } from 'vitest';
import {
  generateSyncChain,
  deriveKeys,
  deriveRoomId,
  deriveEncryptionKey,
  encryptData,
  decryptData,
  validateMnemonic,
  PBKDF2_ITERATIONS,
} from '../crypto';

describe('crypto', () => {
  describe('generateSyncChain', () => {
    it('should generate a valid 12-word mnemonic', () => {
      const mnemonic = generateSyncChain();
      const words = mnemonic.split(' ');
      expect(words.length).toBe(12);
    });

    it('should generate unique mnemonics', () => {
      const mnemonic1 = generateSyncChain();
      const mnemonic2 = generateSyncChain();
      expect(mnemonic1).not.toBe(mnemonic2);
    });
  });

  describe('deriveRoomId', () => {
    it('should produce a valid 64-char hex string', () => {
      const mnemonic = generateSyncChain();
      const roomId = deriveRoomId(mnemonic);
      expect(roomId).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic for the same mnemonic', () => {
      const mnemonic = 'test test test test test test test test test test test ball';
      expect(deriveRoomId(mnemonic)).toBe(deriveRoomId(mnemonic));
    });

    it('should differ for different mnemonics', () => {
      const m1 = 'test test test test test test test test test test test ball';
      const m2 = 'test test test test test test test test test test test borrow';
      expect(deriveRoomId(m1)).not.toBe(deriveRoomId(m2));
    });
  });

  describe('deriveKeys', () => {
    it('should derive consistent keys from same mnemonic', async () => {
      const mnemonic = generateSyncChain();
      const keys1 = await deriveKeys(mnemonic);
      const keys2 = await deriveKeys(mnemonic);
      expect(keys1.roomId).toBe(keys2.roomId);
      expect(keys1.encryptionKey).toBe(keys2.encryptionKey);
    });

    it('should derive different keys from different mnemonics', async () => {
      const mnemonic1 = generateSyncChain();
      const mnemonic2 = generateSyncChain();
      const keys1 = await deriveKeys(mnemonic1);
      const keys2 = await deriveKeys(mnemonic2);
      expect(keys1.roomId).not.toBe(keys2.roomId);
      expect(keys1.encryptionKey).not.toBe(keys2.encryptionKey);
    });

    it('should produce valid hex roomId', async () => {
      const mnemonic = generateSyncChain();
      const keys = await deriveKeys(mnemonic);
      expect(keys.roomId).toMatch(/^[a-f0-9]{64}$/);
    });

    it('memoizes repeated derivation for the same mnemonic', async () => {
      const mnemonic = generateSyncChain();
      const key1 = await deriveEncryptionKey(mnemonic);
      const key2 = await deriveEncryptionKey(mnemonic);
      expect(key1).toBe(key2);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const key = (await deriveKeys(generateSyncChain())).encryptionKey;
      const data = { content: 'Hello, World!', timestamp: Date.now() };
      const encrypted = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toEqual(data);
    });

    it('should produce different ciphertext for same data', async () => {
      const key = (await deriveKeys(generateSyncChain())).encryptionKey;
      const data = { content: 'Test data' };
      const encrypted1 = await encryptData(data, key);
      const encrypted2 = await encryptData(data, key);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when decrypting with wrong key', async () => {
      const key1 = (await deriveKeys(generateSyncChain())).encryptionKey;
      const key2 = (await deriveKeys(generateSyncChain())).encryptionKey;
      const data = { content: 'Secret' };
      const encrypted = await encryptData(data, key1);
      await expect(decryptData(encrypted, key2)).rejects.toThrow();
    });

    it('should throw error for invalid ciphertext', async () => {
      const key = (await deriveKeys(generateSyncChain())).encryptionKey;
      await expect(decryptData('invalid-ciphertext!!!', key)).rejects.toThrow();
    });

    it('should handle complex nested objects', async () => {
      const key = (await deriveKeys(generateSyncChain())).encryptionKey;
      const data = {
        note: {
          id: '123',
          content: 'Nested content',
          metadata: {
            tags: ['tag1', 'tag2'],
            created: Date.now(),
          },
        },
        history: [{ v: 1 }, { v: 2 }],
      };
      const encrypted = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toEqual(data);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate correct 12-word mnemonic', () => {
      const mnemonic = generateSyncChain();
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it('should reject invalid mnemonic formats', () => {
      expect(validateMnemonic('')).toBe(false);
      expect(validateMnemonic('word1 word2')).toBe(false);
      expect(validateMnemonic('word1 word2 word3 word4 word5')).toBe(false);
      expect(validateMnemonic(null)).toBe(false);
      expect(validateMnemonic(123)).toBe(false);
    });

    it('should reject mnemonics with non-alphabetic words', () => {
      expect(validateMnemonic('word1 word2 word3 12345 word6 word7 word8 word9 word10 word11 word12')).toBe(false);
    });

    it('should handle extra whitespace', () => {
      const mnemonic = generateSyncChain();
      expect(validateMnemonic('  ' + mnemonic + '  ')).toBe(true);
    });

    it('should reject mnemonics with invalid BIP39 checksum', () => {
      const mnemonic = generateSyncChain();
      const words = mnemonic.split(' ');
      const original = words[3];
      words[3] = original === 'abandon' ? 'zoo' : 'abandon';
      expect(validateMnemonic(words.join(' '))).toBe(false);
    });
  });

  describe('PBKDF2_ITERATIONS', () => {
    it('should have a reasonable default value', () => {
      expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(10000);
    });
  });
});
