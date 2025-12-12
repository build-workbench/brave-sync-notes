/**
 * 存储模块导出
 */

export { default as ClientStorage } from './ClientStorage';
export { default as IndexedDBStorage } from './IndexedDBStorage';
export { default as LocalStorageAdapter } from './LocalStorageAdapter';
export { default as StorageManager, getStorageManager, resetStorageManager } from './StorageManager';
