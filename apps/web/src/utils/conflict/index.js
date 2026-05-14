/**
 * 冲突检测与解决模块导出
 */

export { default as ConflictService } from './ConflictService';

// Re-export shared utilities for convenience
export { hashContent, generateUniqueId } from '../shared';

// Re-export as ConflictManager for backward compatibility
export { default as ConflictManager } from './ConflictService';

// Re-export as ConflictDetector for backward compatibility (test files)
export { default as ConflictDetector } from './ConflictService';

// Re-export as ConflictResolver for backward compatibility (test files)
export { default as ConflictResolver } from './ConflictService';
