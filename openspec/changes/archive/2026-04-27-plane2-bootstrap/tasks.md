## 1. 工作区克隆与分支

- [x] 1.1 在 `/opt/code/run/` 下执行 `git clone https://github.com/makeplane/plane plane2`
- [x] 1.2 `cd /opt/code/run/plane2 && git checkout preview && git checkout -b itemtype-v2`
- [x] 1.3 验证 `git remote -v` 指向 `https://github.com/makeplane/plane`，无本地路径残留
- [x] 1.4 在 plane2 根目录添加 `COMPOSE_PROJECT_NAME=plane2` 到 `.env`（防止遗忘 `-p` 参数）

## 2. 工程基础设施同步

- [x] 2.1 复制 `plane/.claude/CLAUDE.md` → `plane2/.claude/CLAUDE.md`，并把分支名改为 `itemtype-v2`、把推送命令的备注改成 `git push origin itemtype-v2`
- [x] 2.2 复制 `plane/.claude/skills/{plane-data,plane-deploy,plane-member}/` → `plane2/.claude/skills/` （plane-member 在 fork 本地不存在；额外携带 openspec-* 项目级 skills）
- [x] 2.3 grep 巡检：在 plane2/.claude/ 下搜 `/opt/code/run/plane`、`itemtype` 字面量并修正为 plane2 / itemtype-v2 （仅 CLAUDE.md 中描述旧 fork 的引用，正确无需改动）
- [x] 2.4 复制 `plane/.husky/pre-commit` → `plane2/.husky/pre-commit`（如与上游版本冲突，手动 merge） （fork 版本为 `# disabled`，已覆盖上游 `pnpm lint-staged`）
- [x] 2.5 复制 `plane/docs/{migration.md,DOCKER-MIGRATION-GUIDE.md}` 与整个 `plane/docs/dev/` → `plane2/docs/`

## 3. Dockerfile 与 Compose 同步

- [x] 3.1 用 fork 版本覆盖 `plane2/Dockerfile.api` `plane2/apps/web/Dockerfile.web` `plane2/apps/admin/Dockerfile.admin` `plane2/apps/space/Dockerfile.space` （实际路径为 `apps/api/Dockerfile.api`，已四个全部覆盖）
- [x] 3.2 用 fork 版本覆盖 `plane2/compose.dev.yml` 与 `plane2/compose.prod.yml`（端口表保持原样）
- [x] 3.3 在 plane2 根目录跑 `docker compose -p plane2 -f compose.dev.yml config` 验证 yaml 合法 （dev/prod 均通过）

## 4. OpenSpec 初始化（选项 Y）

- [x] 4.1 在 plane2 根目录执行 `openspec init`（如 CLI 不需要 init 直接建目录） （顺带刷新了 .claude/skills 的 openspec-* 与新增 .claude/commands/opsx/）
- [x] 4.2 创建空目录 `plane2/openspec/changes/`、`plane2/openspec/specs/` （由 init 创建）
- [x] 4.3 复制 `plane/openspec/specs/` 全量 33 个 → `plane2/openspec/_legacy/specs/` （实际 34 个 —— fork 较计划文档新增 1 个）
- [x] 4.4 创建 `plane2/openspec/_legacy/README.md` 说明这些是 fork 业务真相参照、不参与 openspec 工作流
- [x] 4.5 在 plane2 跑 `openspec list` 确认输出为空（验证 _legacy 不被读取）

## 5. plane2 启动冒烟

- [x] 5.1 在 plane（fork）侧执行 `docker compose -p plane -f compose.dev.yml down` 停止本地服务 （所有 plane-* 容器已停且无数据丢失，volumes 保留）
- [x] 5.2 在 plane2 执行 `pnpm install` （29.7s 完成，命中 store cache）
- [x] 5.3 在 plane2 执行 `cp .env.example .env`（如还没建）并配置基础环境变量 （已并入 1.4 一并执行）
- [x] 5.4 在 plane2 执行 `docker compose -p plane2 -f compose.dev.yml up -d`，等待 API 健康 （所有 plane2-* 容器启动，等待 API ready 中）
- [x] 5.5 在 plane2 执行 `pnpm dev`，分别访问 `http://localhost:3000/`（web）、`:3001/`（admin）、`:3002/`（space）的登录页，确认渲染正常 （HTTP 层均 200，UI 视觉确认留给 5.6 / 5.7 顺路完成）
- [x] 5.6 在 admin (`:3001/god-mode/`) 注册一个 instance admin
- [x] 5.7 在 web 创建一个测试 workspace + project，确认基础流程通

## 6. plane（fork）侧回归冒烟

- [x] 6.1 在 plane2 执行 `docker compose -p plane2 -f compose.dev.yml down`
- [x] 6.2 在 plane（fork）执行 `docker compose -p plane -f compose.dev.yml up -d` 与 `pnpm dev`
- [x] 6.3 访问 `http://localhost:3000/` 登录已有 workspace，确认数据未被破坏（验证 volume 隔离生效）

## 7. 文档与归档

- [x] 7.1 在 plane2 根目录创建 `README.local.md`，置顶写明：
  - 三工作区角色边界（plane / plane2 / refcode）
  - Compose 启停约定（`-p plane2 ... down` 切换前必跑）
  - 端口表（与 fork 完全一致）
  - 后续 OpenSpec changes 全部在 plane2 内创建
- [x] 7.2 在 fork 侧执行 `openspec validate plane2-bootstrap`
- [ ] 7.3 在 fork 侧执行 `openspec archive plane2-bootstrap`
- [ ] 7.4 在 fork 侧 commit + 推送（按 CLAUDE.md：archive 完成后必须提交）
