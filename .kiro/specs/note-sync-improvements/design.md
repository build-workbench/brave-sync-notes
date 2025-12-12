# 笔记同步系统改进设计文档

## 概述

本设计文档描述了笔记同步系统的改进方案，重点解决数据持久化、冲突解决、多笔记本支持、离线功能等核心问题。设计遵循端到端加密原则，确保用户数据安全，同时提供流畅的协作体验。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  UI Components  │  State Management  │  Service Workers     │
│  (React)        │  (Zustand)         │  (PWA)               │
├─────────────────────────────────────────────────────────────┤
│  Sync Engine    │  Conflict Resolver │  Crypto Module       │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer  │  IndexedDB         │  LocalStorage        │
└─────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Handler  │  Room Manager  │  Auth Module         │
├─────────────────────────────────────────────────────────────┤
│  Conflict Detector  │  Message Queue │  Session Manager     │
├─────────────────────────────────────────────────────────────┤
│  Persistence Layer  │  Redis/SQLite  │  File System         │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **写入流程**：用户编辑 → 本地存储 → 加密 → WebSocket → 服务器 → 广播到其他设备
2. **读取流程**：服务器推送 → 解密 → 冲突检测 → 合并 → 更新 UI → 保存本地
3. **离线流程**：用户编辑 → 本地队列 → 网络恢复 → 批量同步 → 冲突解决

## 组件和接口

### 1. 持久化存储模块

#### 服务端存储接口

```typescript
interface PersistenceAdapter {
  // 保存同步链数据
  saveRoom(roomId: string, data: EncryptedRoomData): Promise<void>;
  
  // 获取同步链数据
  getRoom(roomId: string): Promise<EncryptedRoomData | null>;
  
  // 删除过期数据
  cleanupExpired(olderThan: Date): Promise<number>;
  
  // 保存操作日志
  appendLog(roomId: string, operation: Operation): Promise<void>;
  
  // 获取操作日志
  getLog(roomId: string, since: number): Promise<Operation[]>;
}

// Redis 实现
class RedisPersistence implements PersistenceAdapter {
  // 使用 Redis Hash 存储房间数据
  // 使用 Redis List 存储操作日志
  // 使用 TTL 自动清理过期数据
}

// SQLite 实现（备选方案）
class SQLitePersistence implements PersistenceAdapter {
  // 使用 SQLite 表存储房间和日志
  // 定期清理任务
}
```

#### 客户端存储接口

```typescript
interface ClientStorage {
  // 笔记本操作
  saveNotebook(notebook: Notebook): Promise<void>;
  getNotebook(id: string): Promise<Notebook | null>;
  listNotebooks(): Promise<Notebook[]>;
  deleteNotebook(id: string): Promise<void>;
  
  // 笔记操作
  saveNote(notebookId: string, note: Note): Promise<void>;
  getNote(notebookId: string, noteId: string): Promise<Note | null>;
  listNotes(notebookId: string): Promise<Note[]>;
  deleteNote(notebookId: string, noteId: string): Promise<void>;
  
  // 历史记录
  saveHistory(noteId: string, entry: HistoryEntry): Promise<void>;
  getHistory(noteId: string, limit?: number): Promise<HistoryEntry[]>;
  
  // 离线队列
  enqueueOperation(op: PendingOperation): Promise<void>;
  dequeueOperations(): Promise<PendingOperation[]>;
  clearQueue(): Promise<void>;
}

// IndexedDB 实现
class IndexedDBStorage implements ClientStorage {
  // 使用多个 object stores
  // notebooks, notes, history, pendingOps
}
```

### 2. 冲突解决模块

#### 冲突检测器

```typescript
interface ConflictDetector {
  // 检测是否存在冲突
  detectConflict(
    local: VersionedContent,
    remote: VersionedContent
  ): ConflictInfo | null;
  
  // 三路合并
  threeWayMerge(
    base: string,
    local: string,
    remote: string
  ): MergeResult;
}

interface ConflictInfo {
  type: 'concurrent_edit' | 'offline_divergence';
  localVersion: VersionedContent;
  remoteVersion: VersionedContent;
  commonAncestor?: VersionedContent;
}

interface MergeResult {
  success: boolean;
  merged?: string;
  conflicts?: ConflictRegion[];
}

interface ConflictRegion {
  startLine: number;
  endLine: number;
  localContent: string;
  remoteContent: string;
}
```

#### 冲突解决策略

```typescript
type ConflictResolutionStrategy = 
  | 'manual'           // 用户手动选择
  | 'last-write-wins'  // 最后写入获胜
  | 'first-write-wins' // 第一个写入获胜
  | 'auto-merge';      // 自动合并

interface ConflictResolver {
  resolve(
    conflict: ConflictInfo,
    strategy: ConflictResolutionStrategy
  ): Promise<string>;
}
```

### 3. 同步引擎

#### 操作转换（Operational Transformation）

```typescript
interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  deviceId: string;
  version: number;
}

interface SyncEngine {
  // 应用本地操作
  applyLocal(op: Operation): void;
  
  // 应用远程操作
  applyRemote(op: Operation): void;
  
  // 转换操作
  transform(op1: Operation, op2: Operation): [Operation, Operation];
  
  // 获取当前版本
  getVersion(): number;
  
  // 同步状态
  getState(): SyncState;
}

type SyncState = 'synced' | 'syncing' | 'conflict' | 'offline';
```

### 4. 多笔记本管理

```typescript
interface NotebookManager {
  // 创建笔记本
  createNotebook(name: string): Promise<Notebook>;
  
  // 切换笔记本
  switchNotebook(id: string): Promise<void>;
  
  // 分享笔记本
  shareNotebook(id: string): Promise<ShareInfo>;
  
  // 加入共享笔记本
  joinNotebook(mnemonic: string): Promise<Notebook>;
}

interface Notebook {
  id: string;
  name: string;
  mnemonic: string;
  encryptionKey: string;
  roomId: string;
  createdAt: number;
  updatedAt: number;
  notes: Note[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}
```

### 5. PWA 与离线支持

#### Service Worker 策略

```typescript
// 缓存策略
const CACHE_STRATEGY = {
  assets: 'cache-first',      // 静态资源
  api: 'network-first',        // API 请求
  sync: 'network-only'         // 同步数据
};

// Service Worker 接口
interface ServiceWorkerManager {
  // 注册 Service Worker
  register(): Promise<void>;
  
  // 缓存资源
  cacheAssets(urls: string[]): Promise<void>;
  
  // 后台同步
  registerBackgroundSync(tag: string): Promise<void>;
  
  // 推送通知
  subscribePush(): Promise<PushSubscription>;
}
```

#### 离线队列

```typescript
interface OfflineQueue {
  // 添加操作到队列
  enqueue(op: PendingOperation): Promise<void>;
  
  // 处理队列
  processQueue(): Promise<ProcessResult>;
  
  // 清空队列
  clear(): Promise<void>;
  
  // 获取队列大小
  size(): Promise<number>;
}

interface PendingOperation {
  id: string;
  type: 'update' | 'create' | 'delete';
  notebookId: string;
  noteId?: string;
  data: any;
  timestamp: number;
  retries: number;
}
```

### 6. 协作功能

#### 光标同步

```typescript
interface CursorManager {
  // 广播光标位置
  broadcastCursor(position: CursorPosition): void;
  
  // 接收光标更新
  onCursorUpdate(callback: (cursor: RemoteCursor) => void): void;
  
  // 移除光标
  removeCursor(deviceId: string): void;
}

interface CursorPosition {
  line: number;
  column: number;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

interface RemoteCursor {
  deviceId: string;
  deviceName: string;
  color: string;
  position: CursorPosition;
  timestamp: number;
}
```

#### 实时状态

```typescript
interface PresenceManager {
  // 广播状态
  broadcastPresence(state: PresenceState): void;
  
  // 订阅状态更新
  onPresenceUpdate(callback: (presence: RemotePresence) => void): void;
}

interface PresenceState {
  status: 'active' | 'idle' | 'away';
  typing: boolean;
  currentNote?: string;
}
```

## 数据模型

### 版本化内容

```typescript
interface VersionedContent {
  content: string;
  version: number;
  timestamp: number;
  deviceId: string;
  parentVersion?: number;
  hash: string;  // SHA-256 hash
}
```

### 历史记录

```typescript
interface HistoryEntry {
  id: string;
  noteId: string;
  content: string;
  delta?: string;  // 与前一版本的差异
  version: number;
  timestamp: number;
  deviceName: string;
  tags: string[];
}
```

### 加密数据格式

```typescript
interface EncryptedData {
  iv: string;           // 初始化向量
  ciphertext: string;   // 加密内容
  tag: string;          // 认证标签（GCM 模式）
  version: number;      // 加密版本
}
```

## 

## 错误处理

### 错误类型

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AUTH_ERROR = 'AUTH_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  code: string;
  recoverable: boolean;
  context?: Record<string, any>;
}
```

### 错误恢复策略

| 错误类型 | 恢复策略 |
|---------|---------|
| NETWORK_ERROR | 自动重试，指数退避，最多 10 次 |
| ENCRYPTION_ERROR | 提示用户检查密钥，不自动重试 |
| STORAGE_ERROR | 尝试备用存储，通知用户 |
| CONFLICT_ERROR | 显示冲突解决界面 |
| VALIDATION_ERROR | 显示错误信息，阻止操作 |
| QUOTA_EXCEEDED | 提示清理历史，提供清理选项 |
| AUTH_ERROR | 提示重新加入同步链 |

## 正确性属性

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于需求分析，以下是系统必须满足的正确性属性：

### Property 1: 加密解密往返一致性
*For any* 有效的笔记内容和加密密钥，加密后再解密应该产生与原始内容完全相同的结果。
**Validates: Requirements 12.5**

### Property 2: 服务器重启数据持久化
*For any* 已保存的同步链数据，服务器重启后应该能够完整恢复该数据。
**Validates: Requirements 1.1**

### Property 3: 冲突检测完整性
*For any* 两个在 5 秒内发生的并发更新，系统应该检测到冲突并保留两个版本。
**Validates: Requirements 2.1**

### Property 4: 离线队列顺序保持
*For any* 离线期间产生的操作序列，重新连接后应该按照原始顺序同步到服务器。
**Validates: Requirements 4.3, 4.4**

### Property 5: 笔记本隔离性
*For any* 两个不同的笔记本，它们的笔记、加密密钥和同步链应该完全独立。
**Validates: Requirements 3.1, 3.2**

### Property 6: 历史版本差异存储
*For any* 保存的历史版本，存储的应该是与前一版本的差异（delta），而不是完整内容。
**Validates: Requirements 5.4**

### Property 7: 备份恢复往返一致性
*For any* 完整备份，恢复后的数据应该与备份时的数据完全一致。
**Validates: Requirements 11.3**

### Property 8: 标签搜索完整性
*For any* 添加到笔记的标签，通过该标签过滤应该返回所有包含该标签的笔记。
**Validates: Requirements 10.3, 10.4**

### Property 9: 导出导入往返一致性
*For any* 导出的笔记本 ZIP 文件，重新导入后应该包含所有原始笔记和元数据。
**Validates: Requirements 9.1, 9.2**

### Property 10: 设备撤销有效性
*For any* 被撤销的设备，该设备应该无法使用旧密钥重新连接到同步链。
**Validates: Requirements 7.5**

### Property 11: 光标广播一致性
*For any* 设备的光标位置变化，所有其他设备应该收到相同的位置信息。
**Validates: Requirements 6.1**

### Property 12: 增量同步有效性
*For any* 超过 1MB 的笔记更新，传输的数据量应该小于完整内容的大小。
**Validates: Requirements 8.1**

### Property 13: 防抖有效性
*For any* 连续的输入操作序列，实际的同步请求数量应该减少至少 80%。
**Validates: Requirements 8.2**

### Property 14: 全文搜索准确性
*For any* 搜索查询，返回的结果应该包含所有匹配该查询的笔记，且不包含不匹配的笔记。
**Validates: Requirements 10.2**

### Property 15: 笔记删除完整性
*For any* 删除的笔记本，其所有关联的笔记应该从本地存储中完全移除。
**Validates: Requirements 3.4**

## 测试策略

### 测试框架选择

- **单元测试**: Vitest（与 Vite 集成良好）
- **属性测试**: fast-check（JavaScript 属性测试库）
- **集成测试**: Playwright（端到端测试）
- **服务端测试**: Jest + Supertest

### 属性测试配置

```javascript
// vitest.config.js
export default {
  test: {
    include: ['**/*.property.test.{js,ts}'],
    testTimeout: 30000, // 属性测试需要更长时间
  }
};

// fast-check 配置
const fcConfig = {
  numRuns: 100,  // 每个属性运行 100 次
  seed: Date.now(),
  verbose: true
};
```

### 测试分类

1. **属性测试**（Property-Based Tests）
   - 加密解密往返测试
   - 备份恢复往返测试
   - 导出导入往返测试
   - 冲突检测测试
   - 搜索准确性测试

2. **单元测试**（Unit Tests）
   - 存储层操作
   - 差异计算
   - 数据验证
   - 错误处理

3. **集成测试**（Integration Tests）
   - WebSocket 连接流程
   - 多设备同步场景
   - 离线/在线切换

### 测试覆盖目标

| 模块 | 覆盖率目标 |
|------|-----------|
| 加密模块 | 95% |
| 存储模块 | 90% |
| 同步引擎 | 85% |
| UI 组件 | 70% |
| 整体 | 80% |

## 实现优先级

### 第一阶段：基础设施（2-3 周）
1. 服务端持久化存储
2. 客户端 IndexedDB 存储
3. 测试框架搭建

### 第二阶段：核心功能（3-4 周）
1. 冲突检测与解决
2. 多笔记本支持
3. 离线队列

### 第三阶段：增强功能（2-3 周）
1. PWA 支持
2. 版本历史与差异比较
3. 搜索与标签

### 第四阶段：协作与安全（2-3 周）
1. 协作光标
2. 密钥轮换
3. 设备管理

### 第五阶段：导入导出（1-2 周）
1. 批量导出
2. 格式转换
3. 备份恢复
