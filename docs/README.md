# 文档目录

本目录是 Note Sync Now 的 VitePress 文档站源码。

## 结构

```
docs/
├── .vitepress/         # VitePress 配置
├── assets/             # 图片、图表等静态资源
├── public/             # 公共静态文件（logo、截图等）
├── zh/                 # 中文文档
├── api/                # API 参考文档
└── changelog/          # 版本历史归档
```

## 本地开发

```bash
cd docs && npm run dev      # 启动 VitePress 开发服务
cd docs && npm run build    # 构建文档站
```

## 变更记录

项目的变更历史统一维护在仓库根目录的 [`CHANGELOG.md`](https://github.com/LessUp/brave-sync-notes/blob/main/CHANGELOG.md)，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式。

协作约定见 [`AGENTS.md`](https://github.com/LessUp/brave-sync-notes/blob/main/AGENTS.md)。
