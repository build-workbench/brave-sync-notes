<div align="center">

# Note Sync Now / 安全同步笔记

端到端加密笔记同步系统

</div>

---

## 核心特性

- **端到端加密**：客户端 AES-256-GCM，服务器只转发密文
- **助记词恢复**：BIP39 标准 12 词，跨设备恢复
- **实时同步**：WebSocket + Socket.IO，自动分块传输
- **冲突解决**：三路合并算法，手动解决 UI
- **离线优先**：IndexedDB 本地存储，离线编辑队列
- **多层存储**：服务端 Redis/SQLite/内存自动降级

## 快速开始

```bash
# 安装并启动后端
cd apps/api && npm ci && npm start

# 新终端安装并启动前端
cd apps/web && npm ci && npm run dev
```

后端监听 `http://localhost:3002`，前端运行在 `http://localhost:5173`。

## 仓库结构

```
brave-sync-notes/
├── apps/
│   ├── web/                 # React + Vite 前端
│   └── api/                 # Express + Socket.IO 后端
├── .github/workflows/ci.yml # CI
├── ARCHITECTURE.md          # 架构设计文档
├── CHANGELOG.md             # 更新日志
└── AGENTS.md                # AI 协作指南
```

## 测试

```bash
# 全部测试
npm test

# 前端
cd apps/web && npm test -- --run

# 后端
cd apps/api && npm test
```

## 架构

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 许可

[MIT](./LICENSE)
