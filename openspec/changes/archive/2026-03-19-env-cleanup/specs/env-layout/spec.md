## ADDED Requirements

### Requirement: 根 .env 只包含 secrets 和基础设施变量

根目录 `.env` 文件 SHALL 只包含以下类型的变量：

- **Secrets**：密码、密钥、access key 等需要用户自定义的敏感信息
- **基础设施连接参数**：数据库主机、端口、存储端点等部署时必须配置的参数
- **部署配置**：监听端口、域名、SSL 证书配置等

根 `.env` 文件 SHALL NOT 包含：

- 可以推导出的非敏感应用配置（如 DEBUG、CORS、worker 数量）
- 已废弃的变量（`OPENAI_*`、`GPT_ENGINE`、`DOCKERIZED`）
- 前端 VITE 变量

#### Scenario: 新部署者检查清单

- **WHEN** 运维人员首次部署项目
- **THEN** 只需编辑根 `.env` 即可完成所有敏感配置，无需进入子目录

#### Scenario: 废弃变量不存在

- **WHEN** 查看根 `.env`
- **THEN** 不存在 `OPENAI_API_BASE`、`OPENAI_API_KEY`、`GPT_ENGINE`、`DOCKERIZED` 等废弃变量

---

### Requirement: 非敏感应用配置内联到 compose 文件

`compose.dev.yml` 和 `compose.prod.yml` 的各服务 `environment` 块 SHALL 直接包含非敏感的固定配置值，不通过 `env_file` 引用外部文件获取这些值。

非敏感变量包括：`DEBUG`、`CORS_ALLOWED_ORIGINS`、`USE_MINIO`、`MINIO_ENDPOINT_SSL`、`GUNICORN_WORKERS`、`HARD_DELETE_AFTER_DAYS`、`SIGNED_URL_EXPIRATION`、`API_KEY_RATE_LIMIT`、`FILE_SIZE_LIMIT`、`*_BASE_URL`、`*_BASE_PATH`、`DATABASE_URL`、`REDIS_URL` 等。

#### Scenario: compose 文件自描述

- **WHEN** 开发者查看 `compose.dev.yml`
- **THEN** 可以直接在文件中看到所有非敏感的应用配置，无需打开 `apps/api/.env` 才能了解服务配置

#### Scenario: dev 和 prod 配置差异可见

- **WHEN** 对比 `compose.dev.yml` 和 `compose.prod.yml`
- **THEN** dev/prod 的差异（如 `DEBUG=1` vs `DEBUG=0`）直接体现在 compose 文件的 environment 块中

---

### Requirement: apps/api/.env 不存在

`apps/api/.env` 文件 SHALL NOT 存在。API 相关服务所需的变量全部来自：

- 根 `.env`（secrets）
- compose 文件的 `environment` 块（非敏感配置）

#### Scenario: 删除 api .env 后服务正常

- **WHEN** `apps/api/.env` 被删除，且 `compose.dev.yml` 的 api/worker/beat-worker/migrator 使用 `env_file: .env`
- **THEN** 所有 API 服务正常启动，Django 能读取到所有必需的环境变量

---

### Requirement: 前端 app .env 最小化

`apps/web/.env`、`apps/admin/.env`、`apps/space/.env` 各文件 SHALL 只包含一行变量：`VITE_API_BASE_URL`，其值在各 app 间可以不同。

其余 VITE 变量（`VITE_WEB_BASE_URL`、`VITE_ADMIN_BASE_URL` 等）SHALL 直接定义在各 app 的 `vite.config.ts` 的 `define` 块中，不依赖 `.env` 文件。

#### Scenario: web 前端使用相对 API URL

- **WHEN** 开发者运行 `pnpm dev`，web app 启动
- **THEN** `VITE_API_BASE_URL` 为空字符串，API 请求走相对路径（经 vite dev proxy 转发）

#### Scenario: admin 前端直连 API

- **WHEN** 开发者运行 `pnpm dev`，admin app 启动
- **THEN** `VITE_API_BASE_URL` 为 `http://localhost:8000`，API 请求直连后端

---

### Requirement: LIVE_SERVER_SECRET_KEY 统一从根 .env 读取

`LIVE_SERVER_SECRET_KEY` 的权威来源 SHALL 是根 `.env` 文件。无论是 dev 环境还是 prod 环境，live 服务读取的值必须与根 `.env` 中定义的值一致。

`apps/live/.env` 中 SHALL NOT 存在独立的 `LIVE_SERVER_SECRET_KEY` 占位值（如 `"secret-key"`），以避免与真实 key 不一致导致的认证错误。

#### Scenario: prod live 服务使用根 .env 的 key

- **WHEN** `compose.prod.yml` 启动 live 服务
- **THEN** live 容器的 `LIVE_SERVER_SECRET_KEY` 来自根 `.env` 的 `${LIVE_SERVER_SECRET_KEY}`，与 API 服务使用的值相同

#### Scenario: dev live 服务使用根 .env 的 key

- **WHEN** 开发者本地运行 `pnpm dev`，live 进程启动
- **THEN** `apps/live/.env` 中的 `LIVE_SERVER_SECRET_KEY` 与根 `.env` 中的值相同（手动同步或读同一文件）
