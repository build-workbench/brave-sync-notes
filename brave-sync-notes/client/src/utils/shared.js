/**
 * 共享工具函数
 */

/**
 * 内容哈希函数 - 用于比较内容是否相同
 * 使用完整内容进行哈希，确保准确性
 * @param {string} content - 要哈希的内容
 * @returns {string} 哈希值
 */
export function hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36) + '_' + content.length;
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
