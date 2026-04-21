---
layout: default
title: 贡献指南
description: Note Sync Now 项目的开发流程、验证命令和文档规范
permalink: /docs/zh-CN/contributing/
lang: zh-CN
---

# 参与贡献 Note Sync Now

感谢您对 Note Sync Now 项目的关注！本指南将帮助您了解开发工作流程。

---

## 🌐 语言 / Language

[English](../en/contributing.md) | [简体中文](./)

---

## 📋 目录

- [快速链接](#快速链接)
- [贡献方式](#贡献方式)
- [开发流程](#开发流程)
- [项目结构](#项目结构)
- [本地开发设置](#本地开发设置)
- [测试指南](#测试指南)
- [代码风格](#代码风格)
- [提交信息规范](#提交信息规范)
- [文档规范](#文档规范)
- [安全注意事项](#安全注意事项)
- [获取帮助](#获取帮助)

---

## 快速链接

| 资源 | 链接 |
|------|------|
| 文档首页 | https://lessup.github.io/brave-sync-notes/ |
| 仓库概览 | https://lessup.github.io/brave-sync-notes/overview/ |
| 更新日志 | https://lessup.github.io/brave-sync-notes/changelog/ |
| 问题追踪 | https://github.com/LessUp/brave-sync-notes/issues |
| 讨论区 | https://github.com/LessUp/brave-sync-notes/discussions |

---

## 贡献方式

### 🐛 报告 Bug

- 先检查该问题是否已存在
- 包含复现步骤
- 提供环境详情（操作系统、Node 版本、浏览器）
- 包含错误消息和日志

### 💡 请求功能

- 描述使用场景
- 解释建议的解决方案
- 讨论已考虑的替代方案

### 📝 改进文档

- 修复错别字和不清晰的解释
- 添加示例和教程
- 翻译为其他语言
- 更新过时的信息

### 🔧 提交代码修改

- Bug 修复
- 性能改进
- 新功能
- 测试覆盖改进

---

## 开发流程

### 1. Fork 和克隆

```bash
# 在 GitHub 上 Fork 仓库，然后克隆您的 fork
git clone https://github.com/您的用户名/brave-sync-notes.git
cd brave-sync-notes
```

### 2. 创建功能分支

```bash
git checkout -b feature/您的功能名称
# 或
git checkout -b fix/bug-描述
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档变更
- `refactor/` - 代码重构
- `test/` - 测试添加/改进

### 3. 进行修改

- 保持提交小而专注
- 编写清晰的提交信息
- 为新功能添加测试
- 根据需要更新文档

### 4. 运行本地验证

```bash
# 客户端验证
cd apps/web
npm ci
npm test -- --run
npm run build

# 服务端验证
cd ../api
npm ci
npm test

# 基于属性的测试（建议用于同步/持久化变更）
npm run test:property
```

### 5. 更新更新日志

每个变更集都应包含更新日志条目。参见[更新日志](/changelog/)。

### 6. 提交 Pull Request

- 提供清晰的变更描述
- 引用相关 issue
- UI 变更包含截图
- 确保所有 CI 检查通过

---

## 项目结构

```
brave-sync-notes/
├── apps/
│   ├── web/                  # React + Vite 前端
│   │   ├── src/
│   │   │   ├── components/  # React 组件
│   │   │   ├── hooks/       # 自定义 React hooks
│   │   │   ├── store/       # Zustand 状态管理
│   │   │   └── utils/       # 工具函数
│   │   ├── tests/           # 测试文件
│   │   └── package.json
│   └── api/                  # Express + Socket.IO 后端
│       ├── src/
│       │   └── persistence/ # 存储适配器
│       ├── tests/           # 测试文件
│       └── package.json
├── docs/                     # 文档
├── changelog/                # 版本历史
└── .github/workflows/        # CI/CD 配置
```

---

## 本地开发设置

### 前置要求

- Node.js 18+（推荐：20 LTS）
- npm 9+
- Redis 7+（可选，用于生产环境模拟）

### 快速开始

```bash
# 终端 1：启动服务端
cd apps/api
npm ci
node index.js

# 终端 2：启动客户端
cd apps/web
npm ci
npm run dev
```

在 `http://localhost:5173` 访问应用。

---

## 测试指南

### 测试组织

| 类型 | 位置 | 命令 |
|------|----------|---------|
| 单元测试 | `*/tests/*.test.js` | `npm test` |
| 集成测试 | `server/tests/*.test.js` | `npm test` |
| 属性测试 | `server/tests/property/*.test.js` | `npm run test:property` |
| E2E 测试 | 计划中 | - |

### 编写测试

- 测试行为，而非实现
- 使用描述性的测试名称
- 遵循 Arrange-Act-Assert 模式
- 模拟外部依赖

示例：

```javascript
describe('useSocket', () => {
  it('应该在 joinChain 时建立连接', async () => {
    // 准备
    const mnemonic = generateTestMnemonic();
    
    // 执行
    const result = await joinChain(mnemonic);
    
    // 验证
    expect(result.connected).toBe(true);
    expect(result.roomId).toBeDefined();
  });
});
```

### 测试覆盖要求

- 新功能：>80% 覆盖率
- Bug 修复：包含回归测试
- 关键路径：100% 覆盖率（加密、同步）

---

## 代码风格

### 一般原则

- 保持函数小而专注（单一职责）
- 优先使用清晰的命名而非短命名
- 避免深层嵌套（最多 3 层）
- 限制函数参数（最多 4 个，更多使用对象）

### JavaScript/React 指南

```javascript
// ✅ 好的：描述性名称，提前返回
function encryptContent(content, mnemonic) {
  if (!content || !mnemonic) {
    throw new Error('需要内容和助记词');
  }
  
  const key = deriveKey(mnemonic);
  return aesEncrypt(content, key);
}

// ❌ 避免：隐晦的名称，深层嵌套
function enc(c, m) {
  if (c && m) {
    const k = doStuff(m);
    if (k) {
      return doMore(c, k);
    }
  }
}
```

### 文件组织

- 每个文件一个组件（React）
- 将相关工具函数分组到模块
- 测试文件与源文件放在一起或放在 `tests/` 目录

---

## 提交信息规范

### 格式

```
<类型>(<范围>): <主题>

<正文>

<页脚>
```

### 类型

| 类型 | 描述 |
|------|-------------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 仅文档变更 |
| `style` | 代码样式变更（格式化） |
| `refactor` | 代码重构 |
| `test` | 添加或更新测试 |
| `chore` | 构建流程或辅助工具变更 |

### 示例

```
feat(sync): 为大内容添加分块传输

实现自动将大于 50KB 的内容拆分为多个块
以便可靠的 WebSocket 传输。

解决 #123
```

```
fix(crypto): 修正 PBKDF2 盐值派生

将盐值从硬编码值改为助记词派生值
以提高安全性。破坏性变更：现有链必须
重新创建。

安全: CVE-2026-XXXX
```

---

## 文档规范

### 何时更新文档

- 新功能：添加使用文档
- API 变更：更新 API 参考
- 配置变更：更新部署指南
- 破坏性变更：包含迁移指南

### 文档结构

- 保持根文档与 GitHub Pages 站点一致
- 优先更新相关的概览/架构/部署/安全页面
- 避免在多个文件中重复解释
- 在同一 PR 中更新文档和更新日志

### 双语文档

- 主要变更应在英文版（`docs/en/`）中进行
- 中文翻译在 `docs/zh-CN/` 中跟进
- 保持两个版本同步

---

## 安全注意事项

### 不要提交

- API 密钥
- 密码
- 私有令牌
- 包含真实值的 `.env` 文件
- 生产服务的测试凭证

### 报告安全问题

如果您发现安全漏洞：

1. **不要**创建公开 issue
2. 发送安全顾虑至：security@lessup.dev（或项目维护者）
3. 留出时间进行修复后再公开披露
4. 安全公告中将给予致谢

### 安全检查清单

- [ ] 代码中没有密钥
- [ ] 已实现输入验证
- [ ] 已考虑速率限制
- [ ] 依赖项已更新（`npm audit`）
- [ ] 配置了安全默认值

---

## 获取帮助

### 沟通渠道

- **一般问题**：GitHub Discussions
- **Bug 报告**：GitHub Issues
- **安全问题**：私人邮件
- **实时聊天**：（如果可用）

### 提问前

1. 查看现有文档
2. 搜索已关闭的 issue
3. 提供最小复现案例
4. 包含环境详情

---

## 致谢

贡献者将在以下位置获得认可：

- 重大贡献的发布说明
- CONTRIBUTORS.md 文件（如果创建）
- Git 提交历史（当然！）

---

## 行为准则

### 我们的标准

- 尊重和包容
- 欢迎新来者
- 专注于建设性反馈
- 尊重不同观点

### 不可接受的行为

- 骚扰或歧视
- 挑衅或煽动性评论
- 发布他人的私人信息
- 其他可合理视为不当的行为

---

感谢您的贡献！🎉

---

*最后更新：2026-04-16*
