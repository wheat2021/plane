## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）

## 2. 清理根 .env

- [x] 2.1 删除根 `.env` 中的废弃变量：`OPENAI_API_BASE`、`OPENAI_API_KEY`、`GPT_ENGINE`、`DOCKERIZED`
- [x] 2.2 确认 `LIVE_SERVER_SECRET_KEY` 已存在于根 `.env`（值与 `apps/api/.env` 中一致）
- [x] 2.3 删除根 `.env` 中不再需要的变量（`PGDATA` 移到 compose environment、`REDIS_HOST`/`REDIS_PORT` 等冗余项）

## 3. 重构 compose.dev.yml

- [x] 3.1 将 api/worker/beat-worker/migrator 的 `env_file: ./apps/api/.env` 改为 `env_file: .env`（根）
- [x] 3.2 在 api 服务的 `environment` 块中内联所有非敏感变量（DEBUG、CORS、DATABASE_URL、REDIS_URL、USE_MINIO、MINIO_ENDPOINT_SSL、GUNICORN_WORKERS、HARD_DELETE_AFTER_DAYS、SIGNED_URL_EXPIRATION、APP_BASE_URL、WEB_URL、ADMIN_BASE_URL/PATH、SPACE_BASE_URL/PATH、LIVE_BASE_URL/PATH、API_KEY_RATE_LIMIT、FILE_SIZE_LIMIT、ENABLE_DRF_SPECTACULAR、API_BASE_URL、SECRET_KEY 通过 `${SECRET_KEY}` 引用）
- [x] 3.3 worker、beat-worker 复制 api 相同的 `environment` 块（去掉 ENABLE_DRF_SPECTACULAR 等 api 专属项）
- [x] 3.4 migrator 的 `environment` 块内联必要变量（至少需要 DATABASE_URL、Django settings 相关）
- [x] 3.5 验证 compose.dev.yml 中 `${VAR}` 引用的变量均在根 `.env` 中存在

## 4. 重构 compose.prod.yml

- [x] 4.1 将 api/worker/beat-worker/migrator 的 `env_file: ./apps/api/.env` 改为 `env_file: .env`（根）
- [x] 4.2 在各服务 `environment` 块中内联非敏感变量（prod 值：DEBUG=0、GUNICORN_WORKERS 适当调整等）
- [x] 4.3 live 服务的 `environment` 块确认 `LIVE_SERVER_SECRET_KEY: ${LIVE_SERVER_SECRET_KEY}` 引用根 `.env`

## 5. 精简前端 app .env

- [x] 5.1 将 `apps/web/vite.config.ts` 中其余 VITE 变量（VITE_WEB_BASE_URL 等）硬编码到 `define` 块，删除 `.env` 中对应项
- [x] 5.2 `apps/web/.env` 精简为只保留 `VITE_API_BASE_URL=""`
- [x] 5.3 将 `apps/admin/vite.config.ts` 中其余 VITE 变量硬编码到 `define` 块
- [x] 5.4 `apps/admin/.env` 精简为只保留 `VITE_API_BASE_URL="http://localhost:8000"`
- [x] 5.5 将 `apps/space/vite.config.ts` 中其余 VITE 变量硬编码到 `define` 块
- [x] 5.6 `apps/space/.env` 精简为只保留 `VITE_API_BASE_URL="http://localhost:8000"`

## 6. 处理 apps/live/.env

- [x] 6.1 `apps/live/.env` 精简：删除 `LIVE_SERVER_SECRET_KEY="secret-key"` 占位值，改为与根 `.env` 相同的真实 key（或 dev 模式下保留空行提示）
- [x] 6.2 `apps/live/.env` 精简：移除 `WEB_BASE_URL`、`LIVE_BASE_URL`、`LIVE_BASE_PATH`（这些为固定 dev 值，在 live 代码中直接使用默认值或 vite.config 等效处理）
- [x] 6.3 确认 dev 模式下 `pnpm dev` 启动 live 服务时 `LIVE_SERVER_SECRET_KEY` 读取正确

## 7. 删除 apps/api/.env

- [x] 7.1 确认 compose.dev.yml 和 compose.prod.yml 中 api 相关服务已不再引用 `apps/api/.env`
- [x] 7.2 删除 `apps/api/.env` 文件

## 8. 提交实现代码

- [x] 8.1 提交 compose 和 .env 重构变更：`#FICC-9999# refactor: 清理 .env 配置，secrets 集中到根 .env，非敏感变量内联到 compose 文件`
- [x] 8.2 提交前端 app .env 精简变更：`#FICC-9999# refactor: 精简前端 app .env，各 app 只保留 VITE_API_BASE_URL`

## 9. 用户验证

- [x] 9.1 执行 `docker compose -f compose.dev.yml up -d --force-recreate` 确认所有容器正常启动（api、worker、beat-worker、migrator、plane-db、plane-redis、plane-mq、plane-minio）
- [x] 9.2 执行 `docker compose -f compose.dev.yml exec api env | grep -E "DEBUG|DATABASE_URL|SECRET_KEY|USE_MINIO|MINIO_PUBLIC_URL"` 确认变量值正确注入
- [x] 9.3 执行 `pnpm dev` 确认 web、admin、space、live 前端正常启动，dotenvx 注入日志显示变量数量正确
- [x] 9.4 在浏览器中打开 `http://localhost:3000`，登录并插入一张图片，确认图片上传正常（不再出现 404 错误）
- [x] 9.5 确认 `apps/api/.env` 文件已不存在
