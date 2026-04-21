# 客户端存储系统

这个模块提供了一个灵活的客户端存储解决方案，支持 IndexedDB 和 LocalStorage，并能自动在两者之间切换。

## 特性

- ✅ **自动降级**: 优先使用 IndexedDB，不可用时自动降级到 LocalStorage
- ✅ **统一接口**: 提供一致的 API，无论使用哪种存储方式
- ✅ **数据迁移**: 支持在不同存储方式之间迁移数据
- ✅ **配额管理**: 自动检测存储配额并提供清理机制
- ✅ **版本管理**: 支持数据库 schema 版本管理和迁移

## 使用方法

### 基本使用

```javascript
import { getStorageManager } from './utils/storage';

// 获取存储管理器实例
const storage = getStorageManager();

// 初始化存储
await storage.initialize();

// 检查使用的存储类型
console.log('Storage type:', storage.getStorageType()); // 'IndexedDB' 或 'LocalStorage'
```

### 笔记本操作

```javascript
// 创建笔记本
const notebook = {
  id: 'notebook-1',
  name: 'My Notebook',
  mnemonic: 'word1 word2 ... word12',
  encryptionKey: 'key123',
  roomId: 'room123',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

await storage.saveNotebook(notebook);

// 获取笔记本
const retrieved = await storage.getNotebook('notebook-1');

// 列出所有笔记本
const notebooks = await storage.listNotebooks();

// 删除笔记本（会级联删除所有笔记和历史记录）
await storage.deleteNotebook('notebook-1');
```

### 笔记操作

```javascript
// 创建笔记
const note = {
  id: 'note-1',
  title: 'My Note',
  content: '# Hello World',
  tags: ['important', 'work'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1
};

await storage.saveNote('notebook-1', note);

// 获取笔记
const retrievedNote = await storage.getNote('notebook-1', 'note-1');

// 列出笔记本中的所有笔记
const notes = await storage.listNotes('notebook-1');

// 删除笔记
await storage.deleteNote('notebook-1', 'note-1');
```

### 历史记录

```javascript
// 保存历史记录
const historyEntry = {
  id: 'history-1',
  noteId: 'note-1',
  content: '# Previous version',
  version: 1,
  timestamp: Date.now(),
  deviceName: 'My Device',
  tags: ['work']
};

await storage.saveHistory('note-1', historyEntry);

// 获取历史记录（默认最近50条）
const history = await storage.getHistory('note-1', 20);

// 清理旧历史记录（保留最近100条）
const deletedCount = await storage.cleanupHistory('note-1', 100);
```

### 离线队列

```javascript
// 添加待处理操作
const operation = {
  id: 'op-1',
  type: 'update',
  notebookId: 'notebook-1',
  noteId: 'note-1',
  data: { content: 'Updated content' },
  timestamp: Date.now(),
  retries: 0
};

await storage.enqueueOperation(operation);

// 获取所有待处理操作
const operations = await storage.dequeueOperations();

// 删除特定操作
await storage.removeOperation('op-1');

// 清空队列
await storage.clearQueue();
```

### 存储管理

```javascript
// 获取存储使用情况
const usage = await storage.getStorageUsage();
console.log(`Used: ${usage.used} bytes`);
console.log(`Quota: ${usage.quota} bytes`);
console.log(`Percentage: ${(usage.percentage * 100).toFixed(1)}%`);

// 清理存储空间（删除旧历史记录）
const freedEntries = await storage.cleanup();
console.log(`Freed ${freedEntries} history entries`);

// 关闭存储连接
await storage.close();
```

### 数据迁移

```javascript
import { IndexedDBStorage, LocalStorageAdapter } from './utils/storage';

// 从 LocalStorage 迁移到 IndexedDB
const localStorage = new LocalStorageAdapter();
await localStorage.initialize();

const indexedDB = new IndexedDBStorage();
await indexedDB.initialize();

const stats = await localStorage.migrateData(indexedDB);
console.log('Migration stats:', stats);
// { notebooks: 5, notes: 20, history: 100, operations: 3 }
```

## 数据结构

### Notebook
```typescript
{
  id: string;              // 唯一标识符
  name: string;            // 笔记本名称
  mnemonic: string;        // 12词助记词
  encryptionKey: string;   // 加密密钥
  roomId: string;          // 服务器房间ID
  createdAt: number;       // 创建时间戳
  updatedAt: number;       // 更新时间戳
}
```

### Note
```typescript
{
  id: string;              // 唯一标识符
  notebookId: string;      // 所属笔记本ID
  title: string;           // 笔记标题
  content: string;         // 笔记内容
  tags: string[];          // 标签列表
  createdAt: number;       // 创建时间戳
  updatedAt: number;       // 更新时间戳
  version: number;         // 版本号
}
```

### HistoryEntry
```typescript
{
  id: string;              // 唯一标识符
  noteId: string;          // 关联的笔记ID
  content: string;         // 历史内容
  delta?: string;          // 与前一版本的差异
  version: number;         // 版本号
  timestamp: number;       // 时间戳
  deviceName: string;      // 设备名称
  tags: string[];          // 标签列表
}
```

### PendingOperation
```typescript
{
  id: string;              // 唯一标识符
  type: 'update' | 'create' | 'delete';  // 操作类型
  notebookId: string;      // 笔记本ID
  noteId?: string;         // 笔记ID（可选）
  data: any;               // 操作数据
  timestamp: number;       // 时间戳
  retries: number;         // 重试次数
}
```

## 配置选项

```javascript
const storage = getStorageManager({
  dbName: 'NoteSyncDB',           // IndexedDB 数据库名称
  version: 1,                      // 数据库版本
  prefix: 'notesync_',            // LocalStorage 键前缀
  maxHistoryPerNote: 100,         // 每个笔记保留的最大历史记录数
  quotaWarningThreshold: 0.9      // 配额警告阈值（90%）
});
```

## 错误处理

```javascript
try {
  await storage.initialize();
} catch (error) {
  if (error.message === 'No storage mechanism available') {
    // 两种存储方式都不可用
    console.error('Storage not available');
  }
}

try {
  await storage.saveNote('notebook-1', note);
} catch (error) {
  if (error.message.includes('quota exceeded')) {
    // 存储配额已满
    await storage.cleanup();
    // 重试
    await storage.saveNote('notebook-1', note);
  }
}
```

## 性能考虑

- **IndexedDB**: 适合大量数据，支持索引和事务
- **LocalStorage**: 适合小量数据，同步操作，有5-10MB限制
- **自动清理**: 历史记录会自动清理，保持存储空间合理
- **批量操作**: 使用事务进行批量操作以提高性能

## 浏览器兼容性

- **IndexedDB**: 所有现代浏览器
- **LocalStorage**: 所有浏览器（包括IE8+）
- **自动降级**: 确保在所有环境中都能工作
