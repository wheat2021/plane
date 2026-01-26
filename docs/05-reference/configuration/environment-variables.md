---
title: 环境变量配置说明
description: Plane 项目环境变量完整参考手册,包括运行时配置和构建时配置的说明
category: reference/configuration
tags: [configuration, environment, docker, deployment]
author: Claude Code Assistant
created: 2025-12-12
updated: 2025-12-30
version: 1.0.0
status: active
---

---
title: 环境变量配置说明
date: 2025-12-12
tags:
  - configuration
  - environment
  - docker
category: Configuration
---

# 环境变量配置说明

> [!info] 配置层级
> Plane 项目的环境变量分为两类：**运行时配置**（重启生效）和**构建时配置**（需要重新构建）

## 📋 服务分类

### ✅ 运行时配置（重启生效）

以下服务支持运行时环境变量，修改 `.env` 文件后**只需重启**即可生效：

| 服务 | 配置文件 | 重启命令 |
|------|---------|---------|
| **API** | `apps/api/.env` | `docker compose restart api` |
| **Worker** | `apps/api/.env` | `docker compose restart bgworker` |
| **Beat Worker** | `apps/api/.env` | `docker compose restart beatworker` |
| **Migrator** | `apps/api/.env` | `docker compose restart plane-migrator` |
| **Live** | `apps/live/.env` | `docker compose restart plane-live` |
| **Proxy** | `.env` | `docker compose restart proxy` |
| **PostgreSQL** | `.env` | `docker compose restart plane-db` |
| **Redis** | - | `docker compose restart plane-redis` |
| **MinIO** | `.env` | `docker compose restart plane-minio` |
| **RabbitMQ** | `.env` | `docker compose restart plane-mq` |

### ⚠️ 构建时配置（需要重新构建）

以下前端服务的环境变量在**构建时**被烘焙到静态 JS 文件中，修改后**必须重新构建**：

| 服务 | 配置文件 | 重新构建命令 |
|------|---------|-------------|
| **Web** | `apps/web/.env` | `docker compose build web && docker compose up -d web` |
| **Admin** | `apps/admin/.env` | `docker compose build admin && docker compose up -d admin` |
| **Space** | `apps/space/.env` | `docker compose build space && docker compose up -d space` |

> [!warning] 前端环境变量限制
> 前端应用使用 Vite 构建，环境变量通过 `import.meta.env` 访问，这些值在构建时被内联到 JavaScript bundle 中，无法在运行时动态修改。

---

## 🔧 修改环境变量的步骤

### 方案 A：运行时配置（后端服务）

```bash
# 1. 修改环境变量文件
vim apps/api/.env        # API 服务
vim apps/live/.env       # Live 服务
vim .env                 # 基础设施服务

# 2. 重启相关服务
docker compose restart api
docker compose restart plane-live
docker compose restart proxy

# 3. 验证配置
docker compose ps
docker logs api --tail 50
```

### 方案 B：构建时配置（前端服务）

```bash
# 1. 修改环境变量文件
vim apps/web/.env
vim apps/admin/.env
vim apps/space/.env

# 2. 重新构建并启动
docker compose build web admin space
docker compose up -d web admin space

# 3. 验证配置
curl -I http://localhost:80/
curl -I http://localhost:80/god-mode/
```

### 方案 C：修改所有服务

```bash
# 1. 停止所有服务
docker compose down

# 2. 修改所有 .env 文件
vim .env
vim apps/api/.env
vim apps/web/.env
vim apps/admin/.env
vim apps/space/.env
vim apps/live/.env

# 3. 重新构建前端服务
docker compose build web admin space

# 4. 启动所有服务
docker compose up -d

# 5. 验证
docker compose ps
bash docs/verify-setup.sh
```

---

## 📝 环境变量文件清单

### 主配置文件

**文件**: `.env`

**作用**: 基础设施服务配置（数据库、Redis、MinIO、RabbitMQ、Proxy）

**关键变量**:
```env
# 数据库
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_DB=plane

# Redis
REDIS_HOST=plane-redis
REDIS_PORT=6379

# 对象存储
AWS_ACCESS_KEY_ID=access-key
AWS_SECRET_ACCESS_KEY=secret-key
AWS_S3_BUCKET_NAME=uploads

# 代理
SITE_ADDRESS=:80
TRUSTED_PROXIES=0.0.0.0/0
FILE_SIZE_LIMIT=5242880

# 端口
LISTEN_HTTP_PORT=80
LISTEN_HTTPS_PORT=443
```

**重启生效**: ✅ 是

---

### API 服务配置

**文件**: `apps/api/.env`

**作用**: Django API、Worker、Beat Worker 配置

**关键变量**:
```env
# 数据库连接
DATABASE_URL=postgresql://plane:plane@plane-db:5432/plane

# Redis
REDIS_URL=redis://plane-redis:6379/

# 密钥
SECRET_KEY=your-secret-key
DJANGO_SECRET_KEY=your-django-secret-key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:80,http://localhost:3000
```

**重启生效**: ✅ 是

---

### Live 服务配置

**文件**: `apps/live/.env`

**作用**: WebSocket 实时协作服务

**关键变量**:
```env
# API 地址（容器内部使用 http://api:8000）
API_BASE_URL=http://api:8000

# WebSocket 密钥
LIVE_SERVER_SECRET_KEY=secret-key

# Redis（容器内部使用 plane-redis）
REDIS_HOST=plane-redis
REDIS_PORT=6379
REDIS_URL=redis://plane-redis:6379/

# 端口
PORT=3000
```

**重启生效**: ✅ 是

> [!note] Live 服务注意事项
> `docker-compose.yml` 中的 `environment` 会覆盖 `.env` 文件中的设置，确保容器间通信使用正确的内部地址。

---

### Web 前端配置

**文件**: `apps/web/.env`

**作用**: 主应用前端配置

**关键变量**:
```env
# API 地址（外部访问地址）
VITE_API_BASE_URL=http://107.174.155.181

# 各服务的外部访问地址
VITE_WEB_BASE_URL=http://107.174.155.181
VITE_ADMIN_BASE_URL=http://107.174.155.181
VITE_ADMIN_BASE_PATH=/god-mode
VITE_SPACE_BASE_URL=http://107.174.155.181
VITE_SPACE_BASE_PATH=/spaces
VITE_LIVE_BASE_URL=http://107.174.155.181
VITE_LIVE_BASE_PATH=/live
```

**重启生效**: ❌ 否（需要重新构建）

---

### Admin 前端配置

**文件**: `apps/admin/.env`

**作用**: 管理后台前端配置

**关键变量**: 同 `apps/web/.env`

**重启生效**: ❌ 否（需要重新构建）

---

### Space 前端配置

**文件**: `apps/space/.env`

**作用**: 公共空间前端配置

**关键变量**: 同 `apps/web/.env`

**重启生效**: ❌ 否（需要重新构建）

---

## 🎯 常见配置场景

### 场景 1：修改外部访问地址

**需求**: 将服务从 `localhost` 改为公网 IP `107.174.155.181`

**步骤**:
```bash
# 1. 修改前端环境变量（需要重新构建）
sed -i 's|localhost|107.174.155.181|g' apps/web/.env
sed -i 's|localhost|107.174.155.181|g' apps/admin/.env
sed -i 's|localhost|107.174.155.181|g' apps/space/.env

# 2. 重新构建前端
docker compose build web admin space

# 3. 重启服务
docker compose up -d web admin space
```

---

### 场景 2：修改数据库密码

**需求**: 更改 PostgreSQL 密码

**步骤**:
```bash
# 1. 修改主配置
vim .env
# 更改 POSTGRES_PASSWORD=new-password

# 2. 修改 API 配置
vim apps/api/.env
# 更改 DATABASE_URL 中的密码

# 3. 停止服务
docker compose down

# 4. 删除旧的数据库 volume（⚠️ 会丢失数据）
docker volume rm plane_pgdata

# 5. 重新启动
docker compose up -d

# 6. 运行迁移
docker exec api python manage.py migrate
```

---

### 场景 3：修改 Redis 连接

**需求**: 使用外部 Redis 服务

**步骤**:
```bash
# 1. 修改主配置
vim .env
# REDIS_HOST=external-redis.example.com
# REDIS_PORT=6379

# 2. 修改 API 配置
vim apps/api/.env
# REDIS_URL=redis://external-redis.example.com:6379/

# 3. 修改 Live 配置
vim apps/live/.env
# REDIS_URL=redis://external-redis.example.com:6379/

# 4. 修改 docker-compose.yml（可选）
# 注释掉 plane-redis 服务
# 移除 depends_on 中的 plane-redis

# 5. 重启服务
docker compose restart api bgworker beatworker plane-live
```

---

### 场景 4：启用 HTTPS

**需求**: 配置 SSL 证书

**步骤**:
```bash
# 1. 修改 Proxy 配置
vim .env
# SITE_ADDRESS=yourdomain.com
# CERT_EMAIL=your@email.com

# 2. 重启 Proxy
docker compose restart proxy

# 3. 查看日志确认证书获取
docker logs proxy -f
```

---

## 🔍 调试环境变量

### 查看容器中的环境变量

```bash
# 查看所有环境变量
docker exec api env

# 查看特定变量
docker exec api env | grep DATABASE_URL

# 查看前端构建的环境变量（已烘焙到代码中）
docker exec web cat /usr/share/nginx/html/index.html | grep -o 'VITE_[^"]*'
```

### 验证环境变量是否生效

```bash
# API 服务
docker exec api python -c "import os; print(os.environ.get('DATABASE_URL'))"

# Live 服务
docker exec plane-live node -e "console.log(process.env.API_BASE_URL)"

# 前端服务（检查构建产物）
docker exec web grep -r "VITE_API_BASE_URL" /usr/share/nginx/html/assets/*.js
```

---

## ⚠️ 注意事项

### 环境变量优先级

Docker Compose 中环境变量的优先级（从高到低）：

1. **docker-compose.yml 中的 `environment`** - 最高优先级
2. **Shell 中的环境变量** - `export VAR=value`
3. **env_file 指定的文件** - `.env` 文件
4. **Dockerfile 中的 ENV** - 构建时设置
5. **默认值** - `${VAR:-default}`

### 容器内外地址差异

> [!important] 地址配置原则
> - **容器间通信**: 使用服务名（如 `http://api:8000`、`plane-redis`）
> - **外部访问**: 使用公网 IP 或域名（如 `http://107.174.155.181`）

**示例**:
```yaml
# docker-compose.yml 中的配置
environment:
  API_BASE_URL: http://api:8000  # 容器内部地址

# apps/web/.env 中的配置
VITE_API_BASE_URL=http://107.174.155.181  # 外部访问地址
```

### 敏感信息保护

> [!warning] 安全建议
> 1. 不要将包含敏感信息的 `.env` 文件提交到 Git
> 2. 使用 `.env.example` 作为模板
> 3. 生产环境使用 Docker Secrets 或环境变量管理工具
> 4. 定期轮换密钥和密码

---

## 📚 相关文档

- [[Docker构建问题修复指南]] - Docker 构建问题
- [[Docker快速参考]] - 常用命令
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)

---

## 🔄 快速参考表

| 修改类型 | 影响服务 | 是否需要重建 | 重启命令 |
|---------|---------|------------|---------|
| 修改 API 地址 | 前端 | ✅ 是 | `docker compose build web admin space && docker compose up -d` |
| 修改数据库配置 | 后端 | ❌ 否 | `docker compose restart api bgworker beatworker` |
| 修改 Redis 配置 | 后端 | ❌ 否 | `docker compose restart api plane-live` |
| 修改 Proxy 配置 | Proxy | ❌ 否 | `docker compose restart proxy` |
| 修改 Live 密钥 | Live | ❌ 否 | `docker compose restart plane-live` |
| 修改端口映射 | 所有 | ⚠️ 部分 | `docker compose up -d` |

---

**文档维护**: DevOps Team
**最后更新**: 2025-12-12
**版本**: 1.0

#configuration #environment #docker #guide
