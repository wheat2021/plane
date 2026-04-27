## Why

`docs/migration.md` 已确定从 fork（`/opt/code/run/plane@itemtype`）迁出，在最新上游基础上重建自定义能力。原计划 Phase 0.1 是「在 `/opt/refcode/plane` 上拉 `itemtype-v2` 分支」，但这会带来两个问题：

1. **污染 refcode 参考库**：`/opt/refcode/plane` 的价值是作为「上游纯净参考」（用于 graphify 双图回归校验、随时 fetch upstream 比对），在其上开工作分支会让它持续偏离上游、丧失参照价值。
2. **运行时与日常使用冲突**：迁移期间当前 fork 仓库需要继续维护（bug fix、生产支持），如果两个仓库共享同一套 Docker 数据 / 端口，切换成本极高。

因此把 Phase 0.1 升级为「在 `/opt/code/run/plane2` 启动一个独立工作区，并保证三维隔离」。

## What Changes

- **新增工作区** `/opt/code/run/plane2`：从 GitHub 直接克隆 `makeplane/plane`（**方案 B**），checkout `preview`，新建 `itemtype-v2` 分支
- **保留 refcode 不动**：`/opt/refcode/plane` 维持纯净参考用途
- **保留当前 fork 不动**：`/opt/code/run/plane@itemtype` 继续日常使用与维护，不在其内 rebase / merge plane2 的变更
- **同步必要的工程基础设施到 plane2**：
  - `.claude/CLAUDE.md`（更新分支名为 `itemtype-v2`、路径常量改为 plane2）
  - `.claude/skills/{plane-data,plane-deploy,plane-member}/`（端口与 .env 路径常量同步调整）
  - `Dockerfile.api / Dockerfile.web / Dockerfile.admin / Dockerfile.space`（多阶段缓存优化是 fork 的核心工程价值，与上游解耦，rebase 安全）
  - `compose.dev.yml / compose.prod.yml`（**仅复制，不改端口** —— 采用场景 P 约定，下文说明）
  - `.husky/pre-commit`、`docs/DOCKER-MIGRATION-GUIDE.md`、`docs/migration.md`、`docs/dev/*.md`
- **采用场景 P 运行时约定**：plane 与 plane2 不并行运行 Docker 服务，切换前先 `docker compose down`。端口与卷靠 Compose 项目名前缀（`plane_*` vs `plane2_*`）自动隔离，**无需改端口表**。
- **OpenSpec 资产采用选项 Y**：在 plane2 中执行 `openspec init` 得到空的 `changes/`；旧的 33 个 specs 复制到 `plane2/openspec/_legacy/specs/` 作为业务真相参照（不进入 `openspec list` 工作流）
- **冒烟双向验证**：plane2 跑通 `docker compose up + pnpm dev + 三端登录页`；同时回 plane 也跑一次冒烟，确认未受影响
- **写一份 `plane2/README.local.md`**：记录端口表、启停约定、与 plane / refcode 三个工作区的角色边界

## Capabilities

### New Capabilities

- `workspace-bootstrap`: 描述 plane / plane2 / refcode 三个工作区的角色边界、隔离策略与启停约定

### Modified Capabilities

（无 —— 此变更不动业务代码）

## Impact

- **代码影响**：本仓库 `/opt/code/run/plane` 不修改任何应用代码；所有改动发生在新建的 `/opt/code/run/plane2`
- **磁盘占用**：plane2 一次性增加约 1.5–2 GB（克隆 + node_modules + Docker 镜像在新项目名前缀下重新拉取）
- **网络流量**：首次 `git clone` 几百 MB；首次 `docker compose build` 因 Compose 项目名变化会重建镜像层，预计 ~800 MB 一次性下载
- **开发流程影响**：从此刻起所有新的 OpenSpec changes（1.1 起）都创建在 plane2 内，本仓库的 `openspec/changes/` 仅保留这一个 `plane2-bootstrap` 作为迁移启动的归档记录
- **回滚**：完全可回滚 —— 只需 `rm -rf /opt/code/run/plane2` 与对应 Docker 资源清理（`docker compose -p plane2 down -v`）。本仓库无任何变更
- **上游冲突风险**：极低 —— Dockerfile 优化仅影响构建层缓存策略，与上游应用代码解耦
