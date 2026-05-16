---
layout: default
title: 同步算法说明
description: Note Sync Now 的同步策略、冲突检测与解决算法。
---

# 同步算法说明

本文档详细说明 Note Sync Now 的同步策略、分块传输与冲突解决算法。

## 同步策略概述

```mermaid
graph TB
    subgraph 本地优先
        A[用户编辑] --> B[本地立即更新]
        B --> C[防抖队列]
    end
    
    subgraph 异步同步
        C --> D[加密内容]
        D --> E{内容大小}
        E -->|小| F[直接发送]
        E -->|大| G[分块发送]
    end
    
    subgraph 服务端处理
        F --> H[验证并存储]
        G --> I[重组并存储]
    end
    
    subgraph 广播
        H --> J[广播到其他设备]
        I --> J
    end
```

## 本地更新策略

### 防抖机制

```mermaid
sequenceDiagram
    participant User as 用户
    participant Debounce as 防抖队列
    participant Sync as 同步引擎
    
    User->>Debounce: 输入 'a'
    Note over Debounce: 启动 300ms 计时器
    
    User->>Debounce: 输入 'b'
    Note over Debounce: 重置计时器
    
    User->>Debounce: 输入 'c'
    Note over Debounce: 重置计时器
    
    Note over Debounce: 300ms 后
    Debounce->>Sync: 发送 'abc'
```

**防抖参数**：

| 参数 | 值 | 说明 |
|------|---|------|
| 延迟时间 | 300ms | 平衡响应性与效率 |
| 最大等待 | 3s | 确保最终同步 |
| 即时触发 | 失焦/提交 | 用户操作完成 |

### 本地状态管理

```typescript
// 状态更新流程
interface NoteState {
  content: string           // 当前内容
  lastSyncedHash: string    // 最后同步的哈希
  isDirty: boolean          // 是否有未同步修改
  pendingUpdate: string | null  // 待发送内容
}

function onUserInput(newContent: string) {
  state.content = newContent
  state.isDirty = true
  
  // 加入防抖队列
  debounceQueue.add(() => {
    state.pendingUpdate = newContent
    syncEngine.pushUpdate(newContent)
  })
}
```

## 分块传输算法

### 分块策略

```mermaid
flowchart TB
    A[内容] --> B{大小 > 100KB?}
    B -->|否| C[单块传输]
    B -->|是| D[分块处理]
    
    D --> E[计算块数]
    E --> F[块大小: 100KB]
    
    F --> G[块 1]
    F --> H[块 2]
    F --> I[块 N]
    
    G --> J[加密并发送]
    H --> J
    I --> J
    
    J --> K[服务端重组]
    K --> L[广播完整内容]
    
    style C fill:#c8e6c9
    style L fill:#c8e6c9
```

**分块参数**：

| 参数 | 值 | 说明 |
|------|---|------|
| 分块阈值 | 100 KB | 超过此大小分块 |
| 块大小 | 100 KB | 每块大小 |
| 最大总大小 | 5 MB | 单次更新上限 |
| 块超时 | 30 s | 块传输超时 |

### 分块实现

```typescript
// 分块发送伪代码
async function sendChunked(content: string, key: CryptoKey, roomId: string) {
  const CHUNK_SIZE = 100 * 1024  // 100 KB
  const encoded = new TextEncoder().encode(content)
  const totalChunks = Math.ceil(encoded.length / CHUNK_SIZE)
  
  if (totalChunks === 1) {
    // 单块直接发送
    const encrypted = await encrypt(encoded, key, roomId)
    socket.emit('push-update', { roomId, encryptedData: encrypted })
    return
  }
  
  // 分块发送
  const sessionId = generateSessionId()
  
  for (let i = 0; i < totalChunks; i++) {
    const chunk = encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const encrypted = await encrypt(chunk, key, roomId)
    
    socket.emit('push-update', {
      roomId,
      encryptedData: encrypted,
      chunkIndex: i,
      totalChunks,
      sessionId
    })
    
    // 等待 ack 后发送下一块
    await waitForAck()
  }
}
```

### 服务端重组

```typescript
// 服务端重组伪代码
const chunkSessions = new Map<string, ChunkSession>()

function handleChunkedUpdate(data: PushUpdate) {
  if (!data.chunkIndex) {
    // 单块直接处理
    processUpdate(data)
    return
  }
  
  // 分块重组
  const session = chunkSessions.get(data.sessionId) || createSession(data)
  session.chunks[data.chunkIndex] = data.encryptedData
  
  if (session.isComplete()) {
    const fullData = session.reassemble()
    processUpdate({ ...data, encryptedData: fullData })
    chunkSessions.delete(data.sessionId)
  }
  
  // 超时清理
  setTimeout(() => chunkSessions.delete(data.sessionId), 30000)
}
```

## 冲突检测算法

### 版本向量

```mermaid
graph LR
    subgraph 设备A
        A1[v1: "Hello"] --> A2[v2: "Hello World"]
    end
    
    subgraph 设备B
        B1[v1: "Hello"] --> B2[v2: "Hello!"]
    end
    
    A2 --> C{冲突检测}
    B2 --> C
    
    C --> D[基础版本: v1]
    C --> E[本地修改: "World"]
    C --> F[远端修改: "!"]
    
    style C fill:#fff9c4
```

### 哈希比较

```typescript
// 冲突检测伪代码
interface ConflictState {
  localHash: string      // 本地内容哈希
  baseHash: string       // 基础版本哈希
  remoteHash: string     // 远端内容哈希
}

function detectConflict(state: ConflictState): ConflictResult {
  // 无冲突：远端与本地一致
  if (state.localHash === state.remoteHash) {
    return { type: 'none' }
  }
  
  // 本地未修改：直接应用远端
  if (state.localHash === state.baseHash) {
    return { type: 'apply-remote' }
  }
  
  // 远端是旧版本：忽略
  if (state.remoteHash === state.baseHash) {
    return { type: 'ignore-remote' }
  }
  
  // 真正的冲突：需要合并
  return { type: 'conflict', needsMerge: true }
}
```

## 三路合并算法

### 算法原理

```mermaid
flowchart TB
    A[本地版本 L] --> D[差异计算]
    B[基础版本 B] --> D
    D --> E[本地差异 diffL]
    
    B --> F[差异计算]
    C[远端版本 R] --> F
    F --> G[远端差异 diffR]
    
    E --> H[合并差异]
    G --> H
    B --> H
    
    H --> I{冲突区域?}
    I -->|无| J[成功合并]
    I -->|有| K[标记冲突]
    
    style J fill:#c8e6c9
    style K fill:#ffcdd2
```

### 合并实现

```typescript
// 三路合并伪代码
function threeWayMerge(
  local: string,
  base: string,
  remote: string
): MergeResult {
  // 1. 计算差异
  const localDiff = diff(base, local)   // B → L 的差异
  const remoteDiff = diff(base, remote) // B → R 的差异
  
  // 2. 尝试合并
  const conflicts: Conflict[] = []
  const merged: string[] = []
  
  // 遍历所有区域
  for (const region of allRegions(localDiff, remoteDiff)) {
    if (region.onlyLocal) {
      // 仅本地修改：应用本地
      merged.push(region.localChange)
    } else if (region.onlyRemote) {
      // 仅远端修改：应用远端
      merged.push(region.remoteChange)
    } else if (region.localChange === region.remoteChange) {
      // 相同修改：任选其一
      merged.push(region.localChange)
    } else {
      // 冲突：标记并保留两者
      conflicts.push({
        position: region.position,
        local: region.localChange,
        remote: region.remoteChange,
        base: region.baseContent
      })
      merged.push(markConflict(region))
    }
  }
  
  return {
    content: merged.join(''),
    conflicts,
    hasConflicts: conflicts.length > 0
  }
}
```

### 冲突标记格式

```
<<<<<<< LOCAL
本地修改内容
=======
远端修改内容
>>>>>>> REMOTE
```

## 重连恢复机制

### 重连流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Server as 服务端
    participant DB as 持久化层
    
    Note over Client: 网络断开
    Client->>Client: 检测断开
    
    Note over Client: 自动重连
    Client->>Server: reconnect
    
    Note over Client: 恢复状态
    Client->>Server: join-chain (roomId)
    Server->>DB: 查询最新状态
    DB-->>Server: 返回密文
    Server-->>Client: sync-update
    
    Client->>Client: 解密内容
    Client->>Client: 冲突检测
    
    alt 无冲突
        Client->>Client: 应用远端内容
    else 有冲突
        Client->>Client: 进入冲突解决流程
    end
```

### 离线队列

```mermaid
flowchart TB
    A[用户编辑] --> B{在线?}
    B -->|是| C[立即同步]
    B -->|否| D[加入离线队列]
    
    D --> E[存储到 IndexedDB]
    
    F[网络恢复] --> G[处理队列]
    G --> H{队列非空?}
    H -->|是| I[发送队列内容]
    I --> H
    H -->|否| J[队列清空]
    
    style C fill:#c8e6c9
    style J fill:#c8e6c9
```

**离线队列属性**：

| 属性 | 值 | 说明 |
|------|---|------|
| 存储 | IndexedDB | 持久化 |
| 最大条目 | 100 | 防止无限增长 |
| 合并策略 | 最后一条有效 | 同一笔记只保留最新 |

## 性能优化

### 增量同步

```mermaid
graph LR
    A[完整内容] --> B[计算差异]
    B --> C[仅发送差异]
    C --> D[服务端应用差异]
    
    E[完整内容] --> F[差异 + 基础版本]
    F --> G[减少传输量]
    
    style G fill:#c8e6c9
```

**优化效果**：

| 场景 | 无优化 | 增量同步 |
|------|-------|---------|
| 小修改 (10B) | 发送 1MB | 发送 ~100B |
| 大文档 (1MB) | 每次发送 1MB | 仅发送差异 |

### 压缩

```typescript
// 可选的压缩层
async function compressAndEncrypt(content: string): Promise<string> {
  // 1. 压缩
  const compressed = await compress(content)  // gzip/brotli
  
  // 2. 加密
  const encrypted = await encrypt(compressed)
  
  return encrypted
}
```

---

::: tip 算法选择
当前实现使用简化的三路合并。对于更复杂的协作场景，可考虑：
- OT (Operational Transformation)
- CRDT (Conflict-free Replicated Data Types)
:::
