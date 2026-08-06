# GitHub Copilot 指南 — Note Sync Now

## 项目概述

端到端加密的笔记同步系统，支持实时同步、离线优先和多设备协作。这是一个追求**小巧灵**的业余项目，不使用重型规范框架。

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS + Zustand + CodeMirror 6
- **后端**：Node.js 20 + Express 5 + Socket.IO 4
- **存储**：Redis / SQLite（服务端，自动降级）；IndexedDB / LocalStorage（客户端）
- **测试**：Vitest（前端）、Jest（后端）、fast-check（属性测试）
- **文档**：VitePress

## 代码约定

### 语言
- JavaScript（ES2022+），不使用 TypeScript
- 用 JSDoc 注释文档化函数
- 异步操作统一使用 `async/await`

### 命名
- 文件：`kebab-case.js`
- 函数/变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- 类/组件：`PascalCase`

### 文件组织
```
apps/
├── web/               # 前端（React + Vite）
│   └── src/
│       ├── components/   # React 组件
│       ├── hooks/        # 自定义 hooks
│       ├── store/        # Zustand store
│       └── utils/        # 工具函数
└── api/               # 后端（Express + Socket.IO）
    ├── index.js          # 服务入口
    └── src/
        └── persistence/  # 存储适配器
```

## 关键模式

### 状态管理（Zustand）
```javascript
// useStore.js 模式
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 状态
  data: null,
  // 动作
  setData: (data) => set({ data }),
  // 计算
  getData: () => get().data,
}));
```

### Socket 事件
- 客户端 → 服务端：`join-chain`、`push-update`、`request-sync`
- 服务端 → 客户端：`sync-update`、`sync-request`、`error`

### 加密
- 内容加密：AES-256-GCM
- 密钥派生：PBKDF2（10,000 轮，助记词派生盐值）
- 12 词 BIP39 助记词恢复密钥

## 测试

```bash
npm test                    # 运行所有测试
npm run test:coverage       # 带覆盖率
npm run test:property       # 属性测试
```

## 关键文件

| 文件 | 用途 |
|------|------|
| `apps/web/src/App.jsx` | 主 React 组件 |
| `apps/web/src/hooks/useSocket.js` | WebSocket 连接 |
| `apps/web/src/store/useStore.js` | 全局状态 |
| `apps/web/src/utils/crypto.js` | 加密工具 |
| `apps/api/index.js` | 服务入口 |

## 协作流程

1. **先读代码**：动手前理解相关模块和现有模式
2. **小步提交**：每个 commit 聚焦一件事，可选 conventional commits 风格
3. **测试驱动**：修 bug 先写复现测试，再修复
4. **同步 CHANGELOG**：用户可见的变更必须写入 `CHANGELOG.md` 的 `[Unreleased]` 段
5. **不镀金**：只做被要求的事，不擅自添加规格外的功能

详见 [`AGENTS.md`](https://github.com/LessUp/brave-sync-notes/blob/main/AGENTS.md)。

## 错误处理

使用结构化错误对象：
```javascript
{
  type: 'ERROR_TYPE',
  message: '人类可读的信息',
  code: 'ERROR_CODE',
  recoverable: true/false
}
```

绝不暴露加密密钥。
