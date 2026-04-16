# 项目规范

本文档整合了笔记同步系统的完整规范，包括需求、设计和实施计划。

## 目录

1. [项目概述](#项目概述)
2. [功能需求](#功能需求)
3. [系统设计](#系统设计)
4. [实施计划](#实施计划)
5. [测试策略](#测试策略)
6. [正确性属性](#正确性属性)

---

## 项目概述

Note Sync Now 是一个端到端加密的实时笔记同步工具，支持多设备协作。

### 核心特性

- **端到端加密**: 客户端 AES-256 加密，服务端只转发密文
- **助记词恢复**: 12 词助记词派生加密密钥
- **实时同步**: WebSocket 双向通信，支持断线重连
- **冲突处理**: 冲突检测与人工解决机制
- **多层存储**: IndexedDB + LocalStorage 双层存储

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS |
| 状态管理 | Zustand |
| 编辑器 | CodeMirror 6 |
| 后端 | Node.js + Express + Socket.IO |
| 存储 | Redis / SQLite / IndexedDB |
| 测试 | Vitest + Jest + fast-check |

---

## 功能需求

### 需求 1：数据持久化与可靠性

**用户故事：** 作为用户，我希望我的笔记数据能够可靠地保存，即使服务器重启或网络中断也不会丢失。

#### 验收标准

1. 服务端重启后能从持久化存储恢复同步链数据
2. 所有设备断开后，服务端保留加密数据至少 7 天
3. 网络中断后重连能同步最新内容
4. 客户端优先使用 IndexedDB，不可用时降级到 LocalStorage
5. 存储配额超限时通知用户并提供清理选项

### 需求 2：冲突检测与解决

**用户故事：** 作为用户，当多个设备同时编辑时，我希望系统能智能处理冲突，避免数据覆盖。

#### 验收标准

1. 5 秒内的并发更新能被检测并保留两个版本
2. 冲突时显示解决界面，展示两个版本
3. 用户解决后合并内容并广播到所有设备
4. 离线编辑重连后检测冲突
5. 冲突存在时阻止新编辑直到解决

### 需求 3：离线模式支持

**用户故事：** 作为用户，我希望离线时也能编辑，网络恢复后自动同步。

#### 验收标准

1. PWA 安装后缓存所有必要资源
2. 离线时显示状态指示器
3. 离线编辑保存本地并记录时间戳
4. 重连后自动同步所有离线更改
5. 离线更改与服务器冲突时应用冲突解决规则

### 需求 4：多笔记支持（规划中）

**用户故事：** 作为用户，我希望能在同一同步链中管理多个笔记。

#### 验收标准

1. 创建笔记时生成唯一标识符
2. 切换笔记时保存当前笔记
3. 删除笔记前确认
4. 重命名笔记时同步到所有设备
5. 笔记按最后修改时间排序

### 需求 5：版本历史

**用户故事：** 作为用户，我希望查看修改历史并能恢复之前的版本。

#### 验收标准

1. 显示保存版本的时间线
2. 选择版本时显示预览
3. 比较版本时显示差异视图
4. 恢复版本时创建新历史条目
5. 历史超过 50 条时自动删除最旧条目

---

## 系统设计

### 架构概览

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

### 核心模块

#### 1. 持久化存储模块

```typescript
interface PersistenceAdapter {
  saveRoom(roomId: string, data: EncryptedRoomData): Promise<void>;
  getRoom(roomId: string): Promise<EncryptedRoomData | null>;
  cleanupExpired(olderThan: Date): Promise<number>;
  appendLog(roomId: string, operation: Operation): Promise<void>;
  getLog(roomId: string, since: number): Promise<Operation[]>;
}
```

#### 2. 冲突解决模块

```typescript
interface ConflictDetector {
  detectConflict(local: VersionedContent, remote: VersionedContent): ConflictInfo | null;
  threeWayMerge(base: string, local: string, remote: string): MergeResult;
}

type ConflictResolutionStrategy = 
  | 'manual'           // 用户手动选择
  | 'last-write-wins'  // 最后写入获胜
  | 'first-write-wins' // 第一个写入获胜
  | 'auto-merge';      // 自动合并
```

#### 3. 同步引擎

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

type SyncState = 'synced' | 'syncing' | 'conflict' | 'offline';
```

### 数据流

1. **写入流程**: 用户编辑 → 本地存储 → 加密 → WebSocket → 服务器 → 广播
2. **读取流程**: 服务器推送 → 解密 → 冲突检测 → 合并 → 更新 UI → 保存本地
3. **离线流程**: 用户编辑 → 本地队列 → 网络恢复 → 批量同步 → 冲突解决

---

## 实施计划

### 第一阶段：基础设施 ✅ (已完成)

- [x] 服务端持久化存储 (Redis + SQLite)
- [x] 客户端存储层 (IndexedDB + LocalStorage)
- [x] 测试框架配置 (Vitest + Jest + fast-check)

### 第二阶段：核心功能 🔄 (进行中)

- [x] 冲突检测与解决
- [ ] 多笔记支持
- [x] 离线队列

### 第三阶段：增强功能 📋 (规划中)

- [ ] PWA 支持
- [ ] 版本历史与差异比较
- [ ] 搜索与标签

### 第四阶段：协作与安全 📋 (规划中)

- [ ] 协作光标
- [ ] 密钥轮换
- [ ] 设备管理

### 第五阶段：导入导出 📋 (规划中)

- [ ] 批量导出
- [ ] 格式转换
- [ ] 备份恢复

---

## 测试策略

### 测试框架

| 类型 | 工具 | 用途 |
|------|------|------|
| 单元测试 | Vitest (客户端) / Jest (服务端) | 功能验证 |
| 属性测试 | fast-check | 不变量验证 |
| 集成测试 | Playwright | 端到端测试 |

### 覆盖率目标

| 模块 | 目标 |
|------|------|
| 加密模块 | 95% |
| 存储模块 | 90% |
| 同步引擎 | 85% |
| UI 组件 | 70% |
| 整体 | 80% |

---

## 正确性属性

以下属性必须在所有有效执行中保持为真：

### P1: 加密解密往返一致性
For any valid content and key, encrypt then decrypt produces identical content.

### P2: 服务器重启数据持久化
For any saved sync chain, server restart restores complete data.

### P3: 冲突检测完整性
For any concurrent updates within 5 seconds, system detects and preserves both versions.

### P4: 离线队列顺序保持
For any offline operations, reconnection syncs in original order.

### P5: 笔记本隔离性
For any two notebooks, their notes, keys, and sync chains are independent.

### P6: 存储往返一致性
For any note object, save then retrieve produces equivalent object.

### P7: 版本恢复完整性
For any history restore, content matches the restored version exactly.

---

## 开发原则

1. **测试驱动**: 每个功能都有对应测试
2. **渐进增强**: 基于现有功能扩展
3. **性能优先**: 优化用户体验和响应速度
4. **安全第一**: 端到端加密和数据保护
5. **用户体验**: 直观界面和流畅交互

---

## 相关文档

- [架构说明](../architecture.md)
- [部署与运行](../deployment.md)
- [安全与同步机制](../security-sync.md)
- [更新日志](../CHANGELOG.md)
