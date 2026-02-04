# Docker Compose 文件迁移指南

## 文件重命名

Docker Compose 配置文件已重命名以更清晰地表达用途：

| 旧文件名                   | 新文件名           | 用途                       |
| -------------------------- | ------------------ | -------------------------- |
| `docker-compose-local.yml` | `compose.dev.yml`  | 开发环境（仅后端基础设施） |
| `docker-compose.yml`       | `compose.prod.yml` | 生产环境（完整服务栈）     |

## 开发工作流

开发环境采用 **混合模式**：后端服务通过 Docker 运行，前端通过 `pnpm dev` 本地运行。

```
┌─────────────────────────────────────────────────────────────┐
│  compose.dev.yml (Docker)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │PostgreSQL│ │  Redis   │ │ RabbitMQ │ │  MinIO   │       │
│  │  :5432   │ │  :6379   │ │  :5672   │ │  :9000   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   API    │ │  Worker  │ │Beat Worker│ │ Migrator │       │
│  │  :8000   │ │          │ │          │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ HTTP API 调用
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  pnpm dev (本地 Node.js)                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │   Web    │ │  Admin   │ │  Space   │                    │
│  │  :3000   │ │  :3001   │ │  :3002   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 完整开发启动步骤

```bash
# 1. 安装依赖（首次或依赖变更后）
pnpm install

# 2. 构建共享包（首次或包代码变更后）
pnpm build

# 3. 启动后端服务（首次需要等待镜像拉取和数据库初始化）
docker compose -f compose.dev.yml up -d

# 4. 查看服务状态，确保所有服务健康
docker compose -f compose.dev.yml ps

# 5. 查看 API 日志（可选，用于调试）
docker compose -f compose.dev.yml logs -f api

# 6. 在另一个终端启动前端开发服务器
pnpm dev
```

> **注意**：首次运行或 `packages/` 目录下的代码变更后，必须先执行 `pnpm build` 构建共享包，否则前端应用无法启动。

### 前端环境变量配置

前端应用需要配置 `.env` 文件指向本地 API。从 `.env.example` 复制：

```bash
# 复制环境变量文件
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/space/.env.example apps/space/.env
```

默认配置已指向正确的本地端口：

| 变量                 | 默认值                    | 说明           |
| -------------------- | ------------------------- | -------------- |
| `VITE_API_BASE_URL`  | `http://localhost:8000`   | API 服务地址   |
| `VITE_WEB_BASE_URL`  | `http://localhost:3000`   | Web 应用地址   |
| `VITE_ADMIN_BASE_URL`| `http://localhost:3001`   | Admin 应用地址 |
| `VITE_SPACE_BASE_URL`| `http://localhost:3002`   | Space 应用地址 |

### 常用开发命令

```bash
# 启动后端服务（后台运行）
docker compose -f compose.dev.yml up -d

# 停止后端服务
docker compose -f compose.dev.yml down

# 重启单个服务（如 API）
docker compose -f compose.dev.yml restart api

# 查看实时日志
docker compose -f compose.dev.yml logs -f api worker

# 进入 API 容器执行命令
docker compose -f compose.dev.yml exec api bash

# 运行数据库迁移
docker compose -f compose.dev.yml exec api python manage.py migrate
```

## 命令对照表

### 开发环境

```bash
# 旧命令
docker compose -f docker-compose-local.yml up
docker compose -f docker-compose-local.yml up --build
docker compose -f docker-compose-local.yml down

# 新命令
docker compose -f compose.dev.yml up
docker compose -f compose.dev.yml up --build
docker compose -f compose.dev.yml down
```

### 生产环境

```bash
# 旧命令
docker compose -f docker-compose.yml up
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml down

# 新命令
docker compose -f compose.prod.yml up
docker compose -f compose.prod.yml up -d
docker compose -f compose.prod.yml down
```

## 构建缓存优化

所有 Dockerfile 已优化缓存层次，你应该能看到：

1. **首次构建**：与之前相同的时间（~5-8分钟）
2. **仅修改代码**：大幅提速，从 3-5 分钟降至 10-30 秒
3. **修改依赖**：仅下载/安装变化的包，而非全部重新安装

### 验证缓存效果

```bash
# 第一次构建（完整构建）
docker compose -f compose.dev.yml build api
# 预期：正常构建时间

# 修改一个源文件（如 apps/api/plane/some_file.py）
docker compose -f compose.dev.yml build api
# 预期：大幅提速，应该在 10-30 秒内完成
```

## 注意事项

1. **BuildKit 必须启用**：所有优化都依赖 Docker BuildKit
   - Docker 23.0+ 默认启用
   - 旧版本需要设置 `DOCKER_BUILDKIT=1`

2. **缓存挂载**：使用 `--mount=type=cache` 需要 Docker BuildKit
   - 缓存位置：`/root/.cache/pip`（Python）、`/pnpm/store`（Node.js）

3. **清理缓存**（如遇到问题）：
   ```bash
   docker builder prune  # 清理构建缓存
   ```

## 如果遇到问题

### Docker 相关

1. **"无法找到 docker-compose-local.yml"**
   - 使用新命令 `compose.dev.yml`

2. **构建很慢，缓存没生效**
   - 检查 Docker 版本：`docker --version`（建议 23.0+）
   - 验证 BuildKit 启用：`docker info | grep BuildKit`

3. **需要完全重建**
   ```bash
   docker compose -f compose.dev.yml build --no-cache
   ```
   注意：`--no-cache` 会跳过所有缓存，耗时较长

### pnpm dev 相关

4. **前端无法连接 API（CORS 错误或 Network Error）**
   - 确认 API 服务正在运行：`docker compose -f compose.dev.yml ps`
   - 确认 API 端口映射正确：应显示 `0.0.0.0:8000->8000/tcp`
   - 检查 `.env` 文件中 `VITE_API_BASE_URL` 是否为 `http://localhost:8000`

5. **pnpm dev 启动失败 - "Failed to resolve entry for package @plane/xxx"**
   - 这是共享包未构建导致的错误
   - 解决方法：`pnpm build` 构建所有共享包
   - 如果只需构建特定包：`pnpm build --filter=@plane/utils`

6. **pnpm dev 启动失败 - 其他原因**
   - 确保已安装依赖：`pnpm install`
   - 确保 `.env` 文件存在：`ls apps/web/.env`
   - 检查端口是否被占用：`lsof -i :3000`

6. **数据库连接失败**
   - 等待 PostgreSQL 完全启动（首次可能需要 30 秒）
   - 检查数据库状态：`docker compose -f compose.dev.yml logs plane-db`
   - 确认 migrator 已完成：`docker compose -f compose.dev.yml logs migrator`

7. **API 返回 500 错误**
   - 查看 API 日志：`docker compose -f compose.dev.yml logs -f api`
   - 检查是否需要运行迁移：`docker compose -f compose.dev.yml exec api python manage.py migrate`

8. **重置开发环境（清除所有数据）**
   ```bash
   # 停止服务并删除数据卷
   docker compose -f compose.dev.yml down -v

   # 重新启动（会重新初始化数据库）
   docker compose -f compose.dev.yml up -d
   ```

## 更多信息

查看详细的优化说明：[docs/2026-02-03-2242-docker-optimization.md](./2026-02-03-2242-docker-optimization.md)
