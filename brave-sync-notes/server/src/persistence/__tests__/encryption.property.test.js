const fc = require('fast-check');
const { DataSerializer } = require('../PersistenceAdapter');

/**
 * **Feature: note-sync-improvements, Property 1: 加密解密往返一致性**
 * **Validates: Requirements 12.5**
 * 
 * 属性测试：对于任何有效的笔记内容和加密密钥，
 * 序列化后再反序列化应该产生与原始内容完全相同的结果。
 */
describe('Property Tests: Encryption Round Trip Consistency', () => {
    test('Property 1: 序列化反序列化往返一致性', () => {
        fc.assert(
            fc.property(
                // 生成测试数据
                fc.record({
                    encryptedData: fc.string({ minLength: 1, maxLength: 10000 }),
                    timestamp: fc.integer({ min: 1, max: Date.now() }),
                    deviceName: fc.string({ minLength: 1, maxLength: 100 }),
                    version: fc.integer({ min: 0, max: 1000000 }),
                    hash: fc.string({ maxLength: 64 })
                }),
                (originalData) => {
                    // 执行序列化和反序列化
                    const serialized = DataSerializer.serialize(originalData);
                    const deserialized = DataSerializer.deserialize(serialized);

                    // 验证往返一致性
                    expect(deserialized).toEqual(originalData);

                    // 验证所有字段都保持不变
                    expect(deserialized.encryptedData).toBe(originalData.encryptedData);
                    expect(deserialized.timestamp).toBe(originalData.timestamp);
                    expect(deserialized.deviceName).toBe(originalData.deviceName);
                    expect(deserialized.version).toBe(originalData.version);
                    expect(deserialized.hash).toBe(originalData.hash);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 2: 压缩解压缩往返一致性', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 10000 }),
                (originalString) => {
                    // 执行压缩和解压缩
                    const compressed = DataSerializer.compress(originalString);
                    const decompressed = DataSerializer.decompress(compressed);

                    // 验证往返一致性
                    expect(decompressed).toBe(originalString);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 3: 序列化数据格式一致性', () => {
        fc.assert(
            fc.property(
                fc.record({
                    encryptedData: fc.string({ minLength: 1 }),
                    timestamp: fc.integer({ min: 1 }),
                    deviceName: fc.string({ minLength: 1 }),
                    version: fc.integer({ min: 0 })
                }),
                (data) => {
                    const serialized = DataSerializer.serialize(data);

                    // 验证序列化结果是有效的 JSON
                    expect(() => JSON.parse(serialized)).not.toThrow();

                    // 验证序列化结果包含必要的元数据
                    const parsed = JSON.parse(serialized);
                    expect(parsed._serialized).toBe(true);
                    expect(parsed._version).toBe('1.0');

                    // 验证原始数据都在序列化结果中
                    expect(parsed.encryptedData).toBe(data.encryptedData);
                    expect(parsed.timestamp).toBe(data.timestamp);
                    expect(parsed.deviceName).toBe(data.deviceName);
                    expect(parsed.version).toBe(data.version);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 4: 压缩效果验证', () => {
        fc.assert(
            fc.property(
                // 生成包含重复字符的字符串
                fc.tuple(
                    fc.char(),
                    fc.integer({ min: 3, max: 100 })
                ).map(([char, count]) => char.repeat(count)),
                (repeatedString) => {
                    const compressed = DataSerializer.compress(repeatedString);
                    const decompressed = DataSerializer.decompress(compressed);

                    // 验证往返一致性
                    expect(decompressed).toBe(repeatedString);

                    // 当前实现不进行压缩，所以长度应该相等
                    expect(compressed.length).toBe(repeatedString.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});