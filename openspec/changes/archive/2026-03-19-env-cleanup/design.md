## Context

当前项目有 6 个 `.env` 文件分布在各子目录中：

| 文件               | 使用方                                                                | 行数 |
| ------------------ | --------------------------------------------------------------------- | ---- |
| `/.env`            | compose.dev.yml 的 db/mq/minio；compose.prod.yml 的 db/mq/minio/proxy | 33   |
| `/apps/api/.env`   | compose.dev.yml 的 api/worker/beat-worker/migrator                    | 43   |
| `/apps/web/.env`   | vite.config.ts（dotenvx 读 `__dirname/.env`）                         | 8    |
| `/apps/admin/.env` | vite.config.ts（同上）                                                | 8    |
| `/apps/space/.env` | vite.config.ts（同上）                                                | 8    |
| `/apps/live/.env`  | `node --env-file=.env .`（dev script）                                | 9    |

主要痛点：`apps/api/.env` 与根 `.env` 有大量重复（DB、MQ、MinIO 凭据各复制一份），修改需同步两处，上次图片上传排查因此浪费时间。

**关键约束（由代码库决定，不可随意改变）：**

- `vite.config.ts` 在三个前端 app 中硬编码 `dotenv.config({ path: path.resolve(__dirname, ".env") })`，只读取各自 app 目录下的 `.env`
- `web` 的 `VITE_API_BASE_URL=""` 与 `admin`/`space` 的 `"http://localhost:8000"` 刻意不同，不能合并为同一值
- `apps/live` 的 dev script 使用 `node --env-file=.env .`，路径相对于 `apps/live/` 目录

## Goals / Non-Goals

**Goals:**

- 根 `.env` 只包含 secrets 和基础设施变量（用户部署时必须自定义的）
- 非敏感的、环境固定的配置直接内联到 `compose.dev.yml` / `compose.prod.yml` 的 `environment` 块
- 前端 app `.env` 精简为只保留各 app 差异化的 `VITE_API_BASE_URL` 一行（共 3 个文件各一行）
- `apps/live/.env` 删除，live 服务改由 compose `environment` 块提供配置
- 删除已废弃变量（`OPENAI_*`、`GPT_ENGINE`、`DOCKERIZED`）
- `LIVE_SERVER_SECRET_KEY` 统一从根 `.env` 读取

**Non-Goals:**

- 不修改 `vite.config.ts`（保持 dotenvx 路径约束不变）
- 不修改 `apps/live/package.json` 的 dev script（live 的 dev 模式继续读 `apps/live/.env`，但精简内容）
- 不引入 secrets 管理工具（Vault、Doppler 等）
- 不修改 Django settings 文件

## Decisions

### 决策 1：根 `.env` 的内容边界

**选择：** 根 `.env` 只保留"敏感变量 + 基础设施连接参数（含端口/地址）"。

变量分类表：

| 变量                                                   | 类型               | 归属                          |
| ------------------------------------------------------ | ------------------ | ----------------------------- |
| `POSTGRES_PASSWORD`                                    | secret             | 根 `.env`                     |
| `POSTGRES_USER`、`POSTGRES_DB`                         | 基础设施           | 根 `.env`                     |
| `RABBITMQ_USER`、`RABBITMQ_PASSWORD`、`RABBITMQ_VHOST` | secret/基础设施    | 根 `.env`                     |
| `AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`           | secret             | 根 `.env`                     |
| `AWS_S3_ENDPOINT_URL`、`MINIO_PUBLIC_URL`              | 基础设施           | 根 `.env`                     |
| `AWS_S3_BUCKET_NAME`                                   | 基础设施           | 根 `.env`                     |
| `SECRET_KEY`                                           | secret             | 根 `.env`                     |
| `LIVE_SERVER_SECRET_KEY`                               | secret             | 根 `.env`                     |
| `LISTEN_HTTP_PORT`、`LISTEN_HTTPS_PORT`                | 部署配置           | 根 `.env`                     |
| `SITE_ADDRESS`、`CERT_*`、`TRUSTED_PROXIES`            | 部署配置           | 根 `.env`                     |
| `MINIO_ENDPOINT_SSL`                                   | 基础设施 flag      | 根 `.env`                     |
| `USE_MINIO`                                            | 非敏感             | compose `environment`         |
| `DEBUG`                                                | 非敏感             | compose `environment`         |
| `CORS_ALLOWED_ORIGINS`                                 | 非敏感             | compose `environment`         |
| `DATABASE_URL`、`REDIS_URL`、`REDIS_HOST` 等           | 派生变量           | compose `environment`         |
| `GUNICORN_WORKERS`                                     | 非敏感             | compose `environment`         |
| `HARD_DELETE_AFTER_DAYS`、`SIGNED_URL_EXPIRATION`      | 非敏感             | compose `environment`         |
| `APP_BASE_URL`、`WEB_URL`、`*_BASE_PATH` 等            | 非敏感             | compose `environment`         |
| `API_KEY_RATE_LIMIT`                                   | 非敏感             | compose `environment`         |
| `FILE_SIZE_LIMIT`                                      | 非敏感             | compose `environment`         |
| `ENABLE_DRF_SPECTACULAR`                               | 非敏感（dev only） | compose.dev.yml `environment` |
| `OPENAI_*`、`GPT_ENGINE`、`DOCKERIZED`                 | 废弃               | 删除                          |

**理由：** 让 `.env` 成为"部署检查清单"——运维人员克隆仓库后只需关注这一个文件，其余配置由代码管理。

### 决策 2：`apps/api/.env` 完全删除，改为 compose 内联 + 根 `.env`

**选择：** `compose.dev.yml` 中 api/worker/beat-worker/migrator 的 `env_file` 改为 `.env`（根），并在各服务的 `environment` 块中内联非敏感变量。

**替代方案考虑：** 保留 `apps/api/.env` 但只放非重复项 → 仍然分散，放弃。

### 决策 3：前端 `.env` 最小化而非删除

**选择：** 保留三个前端 `.env` 文件，但每个只保留一行 `VITE_API_BASE_URL=...`。其余 VITE 变量（URL、路径）内联到各自的 `vite.config.ts` 的 `define` 或通过 compose build args 注入。

**理由：** `vite.config.ts` 硬编码了 `path.resolve(__dirname, ".env")`，改动 vite.config 超出本次范围。三个 app 的 `VITE_API_BASE_URL` 值各不相同（web="" / admin=8000 / space=8000），无法合并。其余 VITE\_ 变量（URLs、paths）是固定的开发端口配置，直接写入 vite.config.ts 的 `define` 块更清晰。

### 决策 4：`apps/live/.env` 的处理

- **dev 模式**：保留 `apps/live/.env` 但只保留 `LIVE_SERVER_SECRET_KEY` 从根读（通过 compose 的 env 注入，dev 下 live 走 `pnpm dev` 不经过 compose）。实际 dev 模式下 live 进程直接读 `apps/live/.env`，因此保留该文件但内容精简
- **prod 模式**：`compose.prod.yml` 已有 `environment` 块直接内联 live 配置（`API_BASE_URL: http://api:8000`），无需 `env_file`

## Risks / Trade-offs

- **[风险] 容器用缓存的 env** → 每次修改 `.env` 后必须用 `--force-recreate` 重建容器（不能用 `restart`）。在 tasks 中明确说明。
- **[风险] `DATABASE_URL` 使用变量插值** → `compose.dev.yml` 的 `environment` 块支持 `${VAR}` 语法，但需确认变量引用顺序正确。
- **[风险] `PGDATA` 根 `.env` 中的值** → postgres 容器用 `PGDATA` env var，需保留在根 `.env` 或 compose environment 中；选择保留在 compose 中作为固定值。
- **[Trade-off] web 的 VITE 变量仍在 `.env` 文件中** → 未能完全消除前端 `.env`，但已从 8 行减到 1 行，可接受。
