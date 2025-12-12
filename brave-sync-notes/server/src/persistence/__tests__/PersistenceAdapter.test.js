const { DataSerializer, DataValidator } = require('../PersistenceAdapter');

describe('DataSerializer', () => {
    const testData = {
        encryptedData: 'test-encrypted-content',
        timestamp: Date.now(),
        deviceName: 'Test Device',
        version: 1,
        hash: 'test-hash'
    };

    test('should serialize and deserialize data correctly', () => {
        const serialized = DataSerializer.serialize(testData);
        const deserialized = DataSerializer.deserialize(serialized);

        expect(deserialized).toEqual(testData);
    });

    test('should handle compression and decompression', () => {
        const testString = 'aaabbbcccdddeeefffggghhhiiijjjkkklllmmmnnnooopppqqqrrrssstttuuuvvvwwwxxxyyyzzz';
        const compressed = DataSerializer.compress(testString);
        const decompressed = DataSerializer.decompress(compressed);

        expect(decompressed).toBe(testString);
        // 当前实现不进行压缩，所以长度应该相等
        expect(compressed.length).toBe(testString.length);
    });

    test('should throw error for invalid serialized data', () => {
        expect(() => {
            DataSerializer.deserialize('invalid-json');
        }).toThrow();

        expect(() => {
            DataSerializer.deserialize('{"invalid": true}');
        }).toThrow();
    });
});

describe('DataValidator', () => {
    test('should validate room IDs correctly', () => {
        expect(DataValidator.isValidRoomId('valid-room-id-123')).toBe(true);
        expect(DataValidator.isValidRoomId('a'.repeat(50))).toBe(true);

        expect(DataValidator.isValidRoomId('')).toBe(false);
        expect(DataValidator.isValidRoomId('short')).toBe(false);
        expect(DataValidator.isValidRoomId('invalid@room#id')).toBe(false);
        expect(DataValidator.isValidRoomId('a'.repeat(101))).toBe(false);
    });

    test('should validate room data correctly', () => {
        const validData = {
            encryptedData: 'test-data',
            timestamp: Date.now(),
            deviceName: 'Test Device',
            version: 1
        };

        expect(DataValidator.isValidRoomData(validData)).toBe(true);

        expect(DataValidator.isValidRoomData(null)).toBe(false);
        expect(DataValidator.isValidRoomData({})).toBe(false);
        expect(DataValidator.isValidRoomData({
            ...validData,
            timestamp: -1
        })).toBe(false);
        expect(DataValidator.isValidRoomData({
            ...validData,
            version: -1
        })).toBe(false);
    });

    test('should validate operations correctly', () => {
        const validOperation = {
            id: 'op-123',
            type: 'insert',
            position: 10,
            content: 'test content',
            timestamp: Date.now(),
            deviceId: 'device-123',
            version: 1
        };

        expect(DataValidator.isValidOperation(validOperation)).toBe(true);

        expect(DataValidator.isValidOperation(null)).toBe(false);
        expect(DataValidator.isValidOperation({})).toBe(false);
        expect(DataValidator.isValidOperation({
            ...validOperation,
            type: 'invalid'
        })).toBe(false);
        expect(DataValidator.isValidOperation({
            ...validOperation,
            position: -1
        })).toBe(false);
    });
});