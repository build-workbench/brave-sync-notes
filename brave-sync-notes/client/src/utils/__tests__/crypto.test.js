import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSyncChain,
  deriveKeys,
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

  describe('deriveKeys', () => {
    it('should derive consistent keys from same mnemonic', () => {
      const mnemonic = generateSyncChain();
      const keys1 = deriveKeys(mnemonic);
      const keys2 = deriveKeys(mnemonic);
      expect(keys1.roomId).toBe(keys2.roomId);
      expect(keys1.encryptionKey).toBe(keys2.encryptionKey);
    });

    it('should derive different keys from different mnemonics', () => {
      const mnemonic1 = generateSyncChain();
      const mnemonic2 = generateSyncChain();
      const keys1 = deriveKeys(mnemonic1);
      const keys2 = deriveKeys(mnemonic2);
      expect(keys1.roomId).not.toBe(keys2.roomId);
      expect(keys1.encryptionKey).not.toBe(keys2.encryptionKey);
    });

    it('should produce valid hex strings', () => {
      const mnemonic = generateSyncChain();
      const keys = deriveKeys(mnemonic);
      expect(keys.roomId).toMatch(/^[a-f0-9]{64}$/);
      expect(keys.encryptionKey).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', () => {
      const key = deriveKeys(generateSyncChain()).encryptionKey;
      const data = { content: 'Hello, World!', timestamp: Date.now() };
      const encrypted = encryptData(data, key);
      const decrypted = decryptData(encrypted, key);
      expect(decrypted).toEqual(data);
    });

    it('should produce different ciphertext for same data', () => {
      const key = deriveKeys(generateSyncChain()).encryptionKey;
      const data = { content: 'Test data' };
      const encrypted1 = encryptData(data, key);
      const encrypted2 = encryptData(data, key);
      // AES with random IV should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when decrypting with wrong key', () => {
      const key1 = deriveKeys(generateSyncChain()).encryptionKey;
      const key2 = deriveKeys(generateSyncChain()).encryptionKey;
      const data = { content: 'Secret' };
      const encrypted = encryptData(data, key1);
      expect(() => decryptData(encrypted, key2)).toThrow();
    }, 10000);

    it('should throw error for invalid ciphertext', () => {
      const key = deriveKeys(generateSyncChain()).encryptionKey;
      expect(() => decryptData('invalid-ciphertext', key)).toThrow();
    }, 10000);

    it('should handle complex nested objects', () => {
      const key = deriveKeys(generateSyncChain()).encryptionKey;
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
      const encrypted = encryptData(data, key);
      const decrypted = decryptData(encrypted, key);
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
  });

  describe('PBKDF2_ITERATIONS', () => {
    it('should have a reasonable default value', () => {
      expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(10000);
    });
  });
});
