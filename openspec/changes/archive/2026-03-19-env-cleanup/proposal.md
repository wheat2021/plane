## Why

项目中 `.env` 配置分散在 6 个文件中，`apps/api/.env` 与根 `.env` 存在大量重复，非敏感的固定配置与敏感的 secrets 混杂在一起，导致每次新增变量时需要同步多个文件，且上次修复图片上传问题时因配置加载路径不清晰而浪费了排查时间。

## What Changes

- **删除** `apps/api/.env`（内容拆分到根 `.env` 和 compose 文件）
- **精简** `apps/web/.env`、`apps/admin/.env`、`apps/space/.env`，只保留各 app 差异化的 `VITE_API_BASE_URL` 一行
- **删除** `apps/live/.env`，改由 `compose.dev.yml` / `compose.prod.yml` 的 `environment` 块提供
- **根 `.env`** 只保留 secrets 和需要用户自定义的基础设施变量
- **`compose.dev.yml`** 内联所有非敏感的开发环境配置（DEBUG、CORS、GUNICORN_WORKERS、URL 等）
- **`compose.prod.yml`** 内联所有非敏感的生产环境配置
- **删除**已废弃变量：`OPENAI_API_BASE`、`OPENAI_API_KEY`、`GPT_ENGINE`、`DOCKERIZED`
- **统一** `LIVE_SERVER_SECRET_KEY`：live 服务统一从根 `.env` 读取，不再在 `apps/live/.env` 中单独维护

## Capabilities

### New Capabilities

- `env-layout`：描述项目 env 配置的目标布局规范（哪些变量放哪里、敏感与非敏感的划分原则）

### Modified Capabilities

无（纯基础设施配置重构，不涉及产品功能规格变更）

## Impact

**文件变更：**

- `apps/api/.env` → 删除
- `apps/live/.env` → 删除
- `apps/web/.env`、`apps/admin/.env`、`apps/space/.env` → 精简为单行
- `.env`（根）→ 移除废弃变量，补充 `LIVE_SERVER_SECRET_KEY`（已有）
- `compose.dev.yml` → 为 api/worker/beat-worker/migrator 新增 `environment` 块，修改 `env_file` 指向根 `.env`
- `compose.prod.yml` → 为 api/worker/beat-worker/migrator/live 新增 `environment` 块

**依赖：**

- `docker compose up --force-recreate` 验证所有服务正常启动
- `pnpm dev` 验证前端 VITE 变量注入正常

**上游冲突风险：**

- `compose.dev.yml` 为本地自定义文件，低风险
- `compose.prod.yml` 如上游更新 env 结构需合并注意
- `apps/api/plane/settings/*.py`：本次不涉及
