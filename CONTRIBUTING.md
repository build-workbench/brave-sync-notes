---
title: 贡献指南
description: Note Sync Now 的贡献流程、本地验证命令与文档/更新日志维护约定。
permalink: /contributing/
---

# 贡献指南

感谢你有兴趣为本项目贡献代码。这是一个追求**小巧灵**的业余项目，流程尽量保持轻量。

## 导航

- 文档首页：<https://lessup.github.io/brave-sync-notes/>
- 项目概览：<https://lessup.github.io/brave-sync-notes/overview/>
- 更新日志：<https://lessup.github.io/brave-sync-notes/changelog/>

## 贡献方式

- 通过 GitHub Issues 报告 bug、提出功能建议
- 改进文档和示例
- 提交 pull request 修复 bug 或实现新功能

## 开发流程

### 1. 准备分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 动手前先读代码

先理解相关模块和现有模式，模仿既有约定。关键入口见 [AGENTS.md](./AGENTS.md) 的「关键文件」一节。

### 3. 小步提交

每个 commit 聚焦一件事，建议使用 conventional commits 风格（`feat:`、`fix:`、`docs:`、`refactor:`、`chore:`）。

### 4. 本地验证

```bash
# 前端
cd apps/web && npm ci && npm test -- --run && npm run build

# 后端
cd apps/api && npm ci && npm test

# 属性测试（触碰 sync / persistence / validation 逻辑时推荐）
cd apps/api && npm run test:property

# 文档
cd docs && npm run build
```

### 5. 维护更新日志

凡是用户可见的变更，**必须**在 [`CHANGELOG.md`](./CHANGELOG.md) 的 `[Unreleased]` 段落追加一条记录，分类如下：

| 分类 | 含义 |
|------|------|
| `Added` | 新增功能 |
| `Changed` | 对已有功能的变更 |
| `Deprecated` | 即将移除的功能 |
| `Removed` | 已移除的功能 |
| `Fixed` | Bug 修复 |
| `Security` | 安全相关修复 |

### 6. 提交 PR

PR 描述请写清楚改了什么、为什么改、关联的 issue 编号。

## 文档约定

- **更新日志是唯一的变更记录**：所有用户可见变更写入 `CHANGELOG.md`
- **保持文档同步**：功能变化时同步更新 `docs/` 下相关页面
- **教程类内容**：放在 `docs/zh/` 下
- **架构类内容**：放在 `docs/zh/architecture.md`，可链接到具体设计文档

## 代码风格

- 函数保持短小、聚焦
- 命名清晰优先于简短
- 复用现有测试框架和项目结构，不擅自引入新工具链
- 用 JSDoc 注释文档化函数
- 遵循项目根目录的 ESLint 配置和 `.editorconfig`
- 异步操作统一使用 `async/await`

## 提交信息

- 使用描述性提交信息
- 可选 conventional commits 风格（`feat:`、`fix:`、`docs:` 等）

## 安全

- 不要提交密钥、密码、令牌等敏感信息
- 发现安全问题请**私下**报告，不要先开公开 issue
