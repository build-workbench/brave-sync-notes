/**
 * 共享工具函数
 */

/**
 * 内容哈希函数 - 用于比较内容是否相同
 * 双 32 位哈希(DJB2 + FNV-1a)拼成 64 位指纹 + 长度,
 * 将 32 位空间下 2^-32 量级的碰撞概率降到 2^-64;
 * 冲突检测仍有内容全等兜底比较,碰撞不会导致静默覆盖。
 * @param {string} content - 要哈希的内容
 * @returns {string} 哈希值
 */
export function hashContent(content) {
    let djb2 = 0;
    let fnv = 0x811c9dc5;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        djb2 = ((djb2 << 5) - djb2 + char) | 0;
        fnv ^= char;
        fnv = (fnv + ((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24))) | 0;
    }
    return djb2.toString(36) + '_' + (fnv >>> 0).toString(36) + '_' + content.length;
}

/**
 * 生成加密安全的唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 唯一ID
 */
export function generateUniqueId(prefix = '') {
    // Use crypto.getRandomValues for cryptographically secure random numbers
    const array = new Uint32Array(3);
    crypto.getRandomValues(array);
    const randomPart = Array.from(array, (n) => n.toString(36)).join('');
    return `${prefix}${Date.now().toString(36)}_${randomPart}`;
}

/**
 * 验证 mnemonic 格式是否有效
 * @param {string} mnemonic - 要验证的 mnemonic
 * @returns {boolean} 是否有效
 */
export function isValidMnemonic(mnemonic) {
    if (!mnemonic || typeof mnemonic !== 'string') {
        return false;
    }

    const words = mnemonic.trim().split(/\s+/);

    // BIP39 mnemonics are 12, 15, 18, 21, or 24 words
    const validLengths = [12, 15, 18, 21, 24];
    if (!validLengths.includes(words.length)) {
        return false;
    }

    // Basic validation: each word should be alphabetic
    return words.every((word) => /^[a-z]+$/.test(word));
}

/**
 * 计算字符串的字节大小（正确处理 Unicode）
 * @param {string} str - 要计算大小的字符串
 * @returns {number} 字节大小
 */
export function getByteSize(str) {
    return new Blob([str]).size;
}
