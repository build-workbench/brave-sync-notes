---
layout: home

hero:
  name: "Note Sync Now"
  text: "端到端加密笔记同步"
  tagline: 技术白皮书 - 你的笔记，只有你能读懂
  actions:
    - theme: brand
      text: 架构概览
      link: /zh-CN/architecture
    - theme: alt
      text: 加密协议
      link: /zh-CN/crypto-protocol
    - theme: alt
      text: GitHub
      link: https://github.com/AICL-Lab/brave-sync-notes

features:
  - icon: 🔐
    title: 端到端加密
    details: AES-256-GCM 加密，客户端密钥派生，服务器只转发密文
  - icon: ⚡
    title: 实时同步
    details: WebSocket 双向通信，毫秒级同步，大文件分块传输
  - icon: 🔄
    title: 三路合并
    details: 智能冲突检测与解决，可视化差异对比
  - icon: 📱
    title: 零账户设计
    details: 扫码即用，助记词恢复，无限设备
  - icon: 💾
    title: 离线优先
    details: IndexedDB 本地存储，离线编辑队列
  - icon: 🚀
    title: 一键部署
    details: Docker 镜像，Redis/SQLite 持久化，K8s 友好
---

## 系统架构

```mermaid
graph TB
    subgraph 客户端层
        C1[React Web App]
        C2[Zustand 状态管理]
        C3[Crypto 加密模块]
        C4[IndexedDB 存储]
        C5[useSocket 同步引擎]
    end
    
    subgraph 服务端层
        S1[Express API]
        S2[Socket.IO]
        S3[PersistenceManager]
        S4[Redis/SQLite]
        S5[内存兜底]
    end
    
    C1 --> C2
    C2 --> C3
    C3 --> C5
    C5 --> C4
    C5 <--> S2
    S2 --> S3
    S3 --> S4
    S3 --> S5
```

## 核心技术特性

| 特性 | 实现方式 | 安全等级 |
|------|---------|---------|
| 加密算法 | AES-256-GCM | military-grade |
| 密钥派生 | PBKDF2 (100,000 iterations) | 抗暴力破解 |
| 同步协议 | WebSocket + 分块传输 | 低延迟 |
| 冲突解决 | 三路合并算法 | 无数据丢失 |
| 存储策略 | IndexedDB + 持久化回退 | 离线可用 |

## 同步流程时序

```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as 服务端
    participant DB as 持久化层
    
    C->>S: join-chain (roomId, deviceName)
    S->>DB: 查询历史密文
    DB-->>S: 返回密文（如有）
    S-->>C: sync-update (encryptedData)
    S->>S: 广播 room-info
    
    Note over C: 用户编辑内容
    C->>C: 加密 + 分块
    C->>S: push-update (encryptedData)
    S->>DB: 存储密文
    S-->>C: update-ack
    S->>S: 广播 sync-update
```

## 技术栈

<div class="tech-stack">

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite 5 |
| 状态管理 | Zustand |
| 加密库 | Web Crypto API |
| 本地存储 | IndexedDB |
| 服务端 | Express + Socket.IO |
| 持久化 | Redis / SQLite |
| 容器化 | Docker |

</div>

## 快速开始

::: code-group
```bash [Docker]
docker run -p 3002:3002 lessup/note-sync-server
```

```bash [源码构建]
git clone https://github.com/AICL-Lab/brave-sync-notes
cd brave-sync-notes
npm install && npm run dev
```
:::

## 文档导航

- [架构说明](/zh-CN/architecture) - 系统边界、核心模块、同步数据流
- [安全机制](/zh-CN/security-sync) - 加密边界、防护措施、威胁模型
- [加密协议](/zh-CN/crypto-protocol) - 密钥派生、加密流程、安全假设
- [同步算法](/zh-CN/sync-algorithm) - 分块传输、冲突解决、重连恢复
- [API 设计](/zh-CN/api-design) - WebSocket 事件、REST 接口

<style>
.tech-stack table {
  width: 100%;
  border-radius: 8px;
}
.tech-stack th,
.tech-stack td {
  padding: 0.5rem 1rem;
}
</style>