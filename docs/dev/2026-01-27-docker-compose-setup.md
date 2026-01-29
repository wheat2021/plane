# Plane 本地 Docker Compose 部署

## 目标

在本地使用 Docker Compose 运行 Plane 项目（社区版）

## 方案

参考官方文档：https://developers.plane.so/self-hosting/methods/docker-compose#install-community-edition

使用项目根目录的 `docker-compose.yml` 配置文件启动完整的 Plane 服务栈。

## 开发日志

### 2026-01-27 初始配置

#### 1. 创建环境配置文件

复制示例配置文件创建实际环境配置：

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

#### 2. 生成安全密钥

为 Django 和 Live Server 生成安全的随机密钥：

```bash
openssl rand -hex 32
```

在 `apps/api/.env` 中添加：

- `SECRET_KEY`: Django 密钥（必需）
- `LIVE_SERVER_SECRET_KEY`: Live 服务器密钥

#### 3. 修复 Proxy 配置问题

发现 Caddy 配置报错：`server block without any key is global configuration, and if used, it must be first`

**问题原因**: proxy 服务缺少必要的环境变量，导致 Caddyfile 中的变量为空

**解决方案**: 在 `docker-compose.yml` 中为 proxy 服务添加缺失的环境变量：

- `SITE_ADDRESS`: 监听地址（默认 :80）
- `CERT_EMAIL`: SSL 证书邮箱（可选）
- `CERT_ACME_CA`: ACME CA 服务器地址
- `CERT_ACME_DNS`: DNS 验证配置（可选）
- `TRUSTED_PROXIES`: 信任的代理地址

#### 4. 启动服务

```bash
docker compose up -d
```

构建并启动了以下服务：

- **数据库**: PostgreSQL 15.7
- **缓存**: Valkey (Redis 兼容) 7.2.11
- **消息队列**: RabbitMQ 3.13.6
- **对象存储**: MinIO
- **后端服务**:
  - API 服务器
  - Worker (后台任务)
  - Beat Worker (定时任务)
  - Migrator (数据库迁移)
- **前端服务**:
  - Web (主应用)
  - Admin (管理面板)
  - Space (公共空间)
  - Live (实时协作)
- **反向代理**: Caddy

### 访问方式

应用已成功运行，可以通过以下方式访问：

- **主应用**: http://localhost
- **管理面板**: http://localhost/god-mode
- **公共空间**: http://localhost/spaces
- **实时协作**: http://localhost/live

### 服务端口映射

- HTTP: 80 (主入口)
- HTTPS: 443 (如配置 SSL)

内部服务通过 Docker 网络互连，不直接暴露端口。

### 2026-01-28 修复文件上传和 Live 服务问题

#### 问题 1: 创建项目时文件上传失败

**错误信息**: `Error uploading cover image: undefined`

**原因分析**:

- MinIO 容器启动时没有自动创建 `uploads` bucket
- API 服务的 MinIO 配置不正确

**解决方案**:

1. 为 MinIO 添加自动创建 bucket 的启动脚本（参考 `docker-compose-local.yml`）
2. 修复 `apps/api/.env` 中的配置：
   - `USE_MINIO=1`（原来是 0）
   - `AWS_S3_ENDPOINT_URL="http://plane-minio:9000"`（使用容器名称而非 localhost）
   - 更新所有 Base URLs 为 `http://localhost`
3. 重启 API 和 worker 服务

手动创建 bucket（已集成到 docker-compose.yml 中）：

```bash
docker exec plane-minio mc alias set myminio http://localhost:9000 access-key secret-key
docker exec plane-minio mc mb myminio/uploads
docker exec plane-minio mc anonymous set download myminio/uploads
```

#### 问题 2: Live 服务不断重启

**错误信息**:

- `Required` API_BASE_URL
- `Required` LIVE_SERVER_SECRET_KEY
- `Redis client not initialized`

**解决方案**: 在 `docker-compose.yml` 中为 live 服务添加环境变量：

```yaml
environment:
  API_BASE_URL: http://api:8000
  LIVE_SERVER_SECRET_KEY: ${LIVE_SERVER_SECRET_KEY}
  REDIS_URL: redis://plane-redis:6379/
depends_on:
  - api
  - plane-redis
```

在根目录 `.env` 中添加：

```bash
LIVE_SERVER_SECRET_KEY="fc892225e1b61ca99fd376dea18cb9fe61ae05c23c48de55cf4dd7663fa65239"
```

### 验证

所有服务现在正常运行：

```bash
docker compose ps
```

应该看到所有容器状态为 `Up` 或 `Up (healthy)`。

## 总结

成功在本地使用 Docker Compose 部署 Plane 社区版。主要步骤包括：

1. 配置环境变量文件
2. 生成安全密钥
3. 修复 proxy 服务的环境变量配置
4. 启动所有服务
5. 修复 MinIO bucket 自动创建和配置
6. 修复 API 服务的 MinIO 端点配置
7. 修复 Live 服务的环境变量配置

系统现已就绪，所有服务运行正常，可通过 http://localhost 访问应用。文件上传功能和实时协作功能均正常工作。
