---
layout: default
title: 安全与同步机制
description: 端到端加密、房间加入、同步广播、冲突处理与服务端防护边界说明。
---

# 安全与同步机制

Note Sync Now 的核心价值不只是"实时同步"，而是"在不把明文交给服务端的前提下完成同步协作"。

## 安全边界图

```mermaid
graph LR
    subgraph 信任域["信任域 (客户端)"]
        A[明文笔记]
        B[加密密钥]
        C[解密内容]
    end
    
    subgraph 非信任域["非信任域 (服务端)"]
        D[密文存储]
        E[房间管理]
        F[事件转发]
    end
    
    A -->|加密| D
    B -.->|从未离开| A
    D -->|转发| G[其他客户端]
    G -->|解密| H[明文笔记]
    
    style 信任域 fill:#e8f5e9
    style 非信任域 fill:#ffebee
```

## 端到端加密流程

```mermaid
sequenceDiagram
    actor User as 用户
    participant Client as 客户端
    participant Server as 服务端
    participant Attacker as 攻击者
    
    Note over User, Attacker: 初始化阶段
    User->>Client: 输入助记词
    Client->>Client: PBKDF2派生密钥<br/>(100,000 iterations)
    Client->>Client: 派生 roomId
    
    Note over User, Attacker: 同步阶段
    User->>Client: 编辑笔记
    Client->>Client: AES-256-GCM 加密
    Client->>Server: 密文传输
    
    rect rgb(255, 200, 200)
        Note over Attacker: 攻击者只能看到密文
        Attacker->>Server: 窃取数据
        Server-->>Attacker: 密文（无法解密）
    end
    
    Server->>Client: 广播密文
    Client->>Client: AES-256-GCM 解密
    Client-->>User: 显示明文
```

## 客户端安全职责

### 密钥管理

```mermaid
flowchart TB
    A[助记词<br/>12个单词] --> B[BIP39]
    B --> C[种子]
    C --> D[PBKDF2]
    D --> E[加密密钥<br/>256-bit]
    D --> F[房间ID<br/>128-bit]
    
    E --> G[AES-256-GCM<br/>加密/解密]
    F --> H[房间标识]
    
    style A fill:#e3f2fd
    style E fill:#c8e6c9
    style F fill:#c8e6c9
```

### 加密模块职责

| 功能 | 实现 | 安全等级 |
|------|------|---------|
| 密钥派生 | PBKDF2 (100,000 iterations) | 抗暴力破解 |
| 加密算法 | AES-256-GCM | 军事级别 |
| 认证标签 | 128-bit GCM tag | 防篡改 |
| 助记词熵 | 128-bit (12 words) | 高熵值 |

**关键代码位置**：
- `apps/web/src/utils/crypto` - 加密模块
- `apps/web/src/hooks/useSocket.js` - 同步引擎
- `apps/web/src/store/useStore.js` - 状态管理

## 服务端安全边界

### 服务端职责

服务端**仅负责**：

```mermaid
graph TB
    A[服务端] --> B[房间成员管理]
    A --> C[同步事件分发]
    A --> D[数据格式校验]
    A --> E[大小与频率限制]
    A --> F[持久化密文]
    A --> G[健康检查与统计]
    
    style A fill:#ffcdd2
    style B fill:#fff9c4
    style C fill:#fff9c4
    style D fill:#fff9c4
    style E fill:#fff9c4
    style F fill:#fff9c4
    style G fill:#fff9c4
```

### 服务端防护措施

```mermaid
flowchart LR
    A[请求] --> B{输入验证}
    B -->|失败| C[拒绝请求]
    B -->|通过| D{访问控制}
    D -->|无权限| C
    D -->|有权限| E{大小限制<br/>< 5MB}
    E -->|超限| C
    E -->|通过| F{频率限制<br/>30次/分钟}
    F -->|超限| C
    F -->|通过| G[处理请求]
    
    style C fill:#ef5350
    style G fill:#66bb6a
```

| 防护措施 | 限制值 | 目的 |
|---------|-------|------|
| 房间ID格式 | 长度+字符限制 | 防止注入 |
| 更新大小 | < 5MB | 防止DoS |
| 更新频率 | 30次/分钟 | 防止滥用 |
| 载荷格式 | 必须有 encryptedData | 格式验证 |

**关键代码位置**：
- `apps/api/index.js` - 服务端入口
- `apps/api/src/persistence/` - 持久化层

## 冲突处理机制

```mermaid
flowchart TB
    A[收到远端更新] --> B[解密数据]
    B --> C{本地有未同步修改?}
    C -->|无| D[直接应用]
    C -->|有| E[计算内容哈希]
    E --> F{哈希相同?}
    F -->|是| D
    F -->|否| G[检测编辑冲突]
    G --> H{基础版本一致?}
    H -->|是| I[三路合并]
    H -->|否| J[加入冲突队列]
    I --> K{合并成功?}
    K -->|是| D
    K -->|否| J
    J --> L[提示用户解决]
    
    style D fill:#c8e6c9
    style J fill:#ffcdd2
    style L fill:#fff9c4
```

### 三路合并算法

```mermaid
sequenceDiagram
    participant Local as 本地版本
    participant Base as 基础版本
    participant Remote as 远端版本
    participant Result as 合并结果
    
    Note over Local, Result: 三路合并
    Local->>Base: 计算本地差异 (diff1)
    Remote->>Base: 计算远端差异 (diff2)
    
    alt 无冲突区域
        Base->>Result: 应用 diff1
        Base->>Result: 应用 diff2
    else 有冲突区域
        Base->>Result: 标记冲突
        Result->>Result: 等待用户决策
    end
```

## 威胁模型

```mermaid
graph TB
    subgraph 威胁["潜在威胁"]
        T1[网络窃听]
        T2[服务端被攻破]
        T3[中间人攻击]
        T4[暴力破解]
        T5[DoS攻击]
    end
    
    subgraph 防护["安全措施"]
        P1[TLS加密传输]
        P2[零知识架构]
        P3[端到端加密]
        P4[PBKDF2高迭代]
        P5[频率限制]
    end
    
    T1 -.->|防护| P1
    T2 -.->|防护| P2
    T3 -.->|防护| P3
    T4 -.->|防护| P4
    T5 -.->|防护| P5
    
    style 威胁 fill:#ffcdd2
    style 防护 fill:#c8e6c9
```

| 威胁 | 风险等级 | 防护措施 | 状态 |
|------|---------|---------|------|
| 网络窃听 | 高 | TLS + E2EE | ✅ 已防护 |
| 服务端数据泄露 | 高 | 零知识架构 | ✅ 已防护 |
| 中间人攻击 | 中 | 客户端加密 | ✅ 已防护 |
| 暴力破解密钥 | 中 | PBKDF2 (100k iter) | ✅ 已防护 |
| DoS攻击 | 中 | 频率/大小限制 | ✅ 已防护 |
| 客户端恶意代码 | 低 | 代码审计 | ⚠️ 需用户注意 |

## 运行时可观测性

服务端提供：

| 端点 | 用途 | 信息 |
|------|------|------|
| `/health` | 健康检查 | 连接数、房间数、持久化状态 |
| `/stats` | 统计信息 | 内存使用、持久化统计 |

## 推荐阅读顺序

1. [架构说明](/zh-CN/architecture)
2. 当前页面：安全与同步机制
3. [加密协议详解](/zh-CN/crypto-protocol)
4. [部署与运行](/zh-CN/deployment)
