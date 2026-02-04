# Docker Compose 文件迁移指南

## 文件重命名

Docker Compose 配置文件已重命名以更清晰地表达用途：

| 旧文件名                   | 新文件名           | 用途                       |
| -------------------------- | ------------------ | -------------------------- |
| `docker-compose-local.yml` | `compose.dev.yml`  | 开发环境（仅后端基础设施） |
| `docker-compose.yml`       | `compose.prod.yml` | 生产环境（完整服务栈）     |

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

## 更多信息

查看详细的优化说明：[docs/2026-02-03-2242-docker-optimization.md](./2026-02-03-2242-docker-optimization.md)
