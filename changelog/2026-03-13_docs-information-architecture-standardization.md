# 2026-03-13 文档与 Pages 信息架构规范化

## 变更背景

- 按批次 A 的统一要求，收敛仓库入口与文档入口职责。
- 此前 `README.md`、`README.zh-CN.md` 与 `index.md` 都在重复介绍项目能力、部署与使用方式，信息层次不清。
- `_config.yml` 中仍保留旧仓库名 `sync-notes` 的 `repository` / `baseurl`，Pages workflow 也只监听 `main`，与当前仓库实际状态不一致。

## 导航与目录调整

- 保持现有 Jekyll 站点结构不变，继续使用根目录 `index.md` 作为文档首页。
- 将 `README.md` / `README.zh-CN.md` 收敛为仓库入口，仅保留定位、最小启动方式、文档链接与许可证信息。
- 将 `CONTRIBUTING.md` 明确纳入文档入口与 workflow 的发布范围，作为开发指南页面使用。

## 首页调整

- `index.md` 改写为文档导读页，增加项目定位、适合谁、从哪里开始、推荐阅读路径与核心入口表。
- 首页不再重复完整功能清单和部署长文，改为把用户引导到 `README`、`CONTRIBUTING.md` 与 `changelog/`。
- 修正首页中的 GitHub 仓库与 workflow 徽章链接，统一指向 `LessUp/brave-sync-notes`。

## Pages / Workflow 调整

- `_config.yml` 中的 `repository` 从 `LessUp/sync-notes` 修正为 `LessUp/brave-sync-notes`。
- `_config.yml` 中的 `baseurl` 从 `/sync-notes` 修正为 `/brave-sync-notes`，并统一站点语言为 `zh-CN`。
- `.github/workflows/pages.yml` 的推送触发分支从仅 `main` 扩展为 `master, main`。
- `.github/workflows/pages.yml` 的 `paths` 与 sparse checkout 新增 `CONTRIBUTING.md`，保证开发指南更新能触发并进入构建产物。

## 验证结果

- 已人工核对仓库远程地址为 `https://github.com/LessUp/brave-sync-notes.git`，与修正后的 `repository` / `baseurl` 一致。
- 已确认当前本地仓库无其他已跟踪文件改动，便于本次信息架构调整单独审阅。
- 已人工检查 `README`、`index.md`、`CONTRIBUTING.md` 与 `changelog/` 之间的链接关系与现有文件结构一致。
- 本次未运行本地 Jekyll 构建；后续可在具备 Ruby / Jekyll 环境时补充静态构建验证。

## 后续待办

- 如后续补充更细的架构或部署文档，建议新增独立页面并继续保持首页只做导读。
- 如仓库后续切换默认分支，可再收敛 workflow 触发分支配置。
