---
title: Plane 项目部署指南
description: Plane 开源项目管理平台的完整部署指南，包括本地开发环境、Docker 部署和生产环境配置
category: guides/deployment
tags: [deployment, docker, docker-compose, production, development]
author: Terry Chen
created: 2025-12-30
updated: 2025-12-30
version: 1.0.0
status: active
---

# Plane 项目部署指南

## 概述

本指南详细介绍如何在不同环境下部署 Plane 项目管理平台，包括本地开发环境、Docker Compose 部署和生产环境配置。Plane 是一个基于 monorepo 的全栈应用，包含多个前端应用和 Django 后端 API。

## 前置条件

在开始部署之前，请确保系统满足以下要求：

### 硬件要求

- [ ] **CPU**: 4 核心或更多
- [ ] **内存**: 最少 12GB RAM (8GB 可能导致构建失败)
- [ ] **磁盘**: 至少 20GB 可用空间

### 软件要求

- [ ] **Node.js**: v22.18.0 或更高版本
- [ ] **pnpm**: v10.21.0 (项目指定版本)
- [ ] **Docker**: 最新稳定版本
- [ ] **Docker Compose**: v2.0 或更高版本
- [ ] **Git**: 用于克隆仓库
- [ ] **Python**: 3.8+ (用于 Django API)
- [ ] **PostgreSQL**: v14 或更高版本
- [ ] **Redis**: v6.2.7 或更高版本

### 网络要求

- [ ] 能够访问 GitHub 和 npm registry
- [ ] 开放端口: 3000 (Web), 3001 (Admin), 3002 (Space), 8000 (API)

## 部署选项

Plane 支持三种主要部署方式：

| 部署方式 | 适用场景 | 复杂度 | 推荐指数 |
|---------|---------|--------|---------|
| 本地开发环境 | 开发和调试 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Docker Compose | 快速测试和演示 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 生产环境 | 正式部署 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 方式一: 本地开发环境部署

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/makeplane/plane.git
cd plane
```

**预期结果**: 成功克隆仓库并进入项目目录

### 步骤 2: 安装 pnpm (如未安装)

```bash
# 使用 npm 安装 pnpm
npm install -g pnpm@10.21.0

# 或使用 Homebrew (macOS)
brew install pnpm

# 验证安装
pnpm --version
```

**预期结果**: 显示 pnpm 版本号 `10.21.0`

### 步骤 3: 安装依赖

```bash
# 安装所有 workspace 依赖
pnpm install
```

**预期结果**: 成功安装所有依赖，可能需要 5-10 分钟

### 步骤 4: 配置环境变量

```bash
# 复制示例环境变量文件
cp .env.example .env

# 编辑 .env 文件
# 重要配置项:
# VITE_API_BASE_URL=http://localhost:8000
# VITE_WEB_BASE_URL=http://localhost:3000
# VITE_ADMIN_BASE_URL=http://localhost:3001
# VITE_SPACE_BASE_URL=http://localhost:3002
```

**关键环境变量说明**:

| 变量名 | 说明 | 示例值 |
|-------|------|--------|
| `VITE_API_BASE_URL` | API 服务地址 | `http://localhost:8000` |
| `VITE_WEB_BASE_URL` | Web 应用地址 | `http://localhost:3000` |
| `VITE_ADMIN_BASE_URL` | Admin 应用地址 | `http://localhost:3001` |
| `VITE_ADMIN_BASE_PATH` | Admin 路径前缀 | `/god-mode` |
| `VITE_SPACE_BASE_URL` | Space 应用地址 | `http://localhost:3002` |

### 步骤 5: 启动后端服务 (Docker Compose)

```bash
# 启动 PostgreSQL、Redis 等后端服务
docker compose -f docker-compose-local.yml up -d

# 查看服务状态
docker compose -f docker-compose-local.yml ps
```

**预期结果**:
```
NAME                     SERVICE      STATUS      PORTS
plane-postgres           postgres     running     0.0.0.0:5432->5432/tcp
plane-redis              redis        running     0.0.0.0:6379->6379/tcp
```

### 步骤 6: 初始化数据库

```bash
# 运行初始化脚本
./setup.sh
```

或手动执行：

```bash
cd apps/api

# 运行数据库迁移
python manage.py migrate

# 创建超级用户 (可选)
python manage.py createsuperuser

# 返回项目根目录
cd ../..
```

**预期结果**: 数据库表创建成功，无错误信息

### 步骤 7: 启动所有开发服务器

```bash
# 启动所有前端和后端服务 (并发 18 个进程)
pnpm dev
```

**预期结果**: 所有服务启动成功，显示类似以下输出：

```
web:dev: ➜  Local:   http://localhost:3000/
admin:dev: ➜  Local:   http://localhost:3001/
space:dev: ➜  Local:   http://localhost:3002/
api:dev: Django version 4.2, using settings 'plane.settings.local'
api:dev: Starting development server at http://127.0.0.1:8000/
```

### 步骤 8: 访问应用

在浏览器中打开以下地址：

- **主应用**: http://localhost:3000
- **管理后台**: http://localhost:3001/god-mode/
- **公共空间**: http://localhost:3002

---

## 方式二: Docker Compose 部署

### 步骤 1: 准备环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库密码、密钥等
```

**必须配置的环境变量**:

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=plane

# Redis 配置
REDIS_PASSWORD=your_redis_password

# Django 密钥
SECRET_KEY=your_django_secret_key
```

### 步骤 2: 构建和启动所有服务

```bash
# 构建镜像
docker compose build

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

**预期结果**: 所有容器成功启动

```bash
docker compose ps
```

### 步骤 3: 初始化数据库

```bash
# 进入 API 容器
docker compose exec api bash

# 运行数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 退出容器
exit
```

### 步骤 4: 验证部署

访问 http://localhost:3000，检查应用是否正常运行。

---

## 方式三: 生产环境部署

### 架构概览

```mermaid
graph LR
    A[Nginx/负载均衡器] --> B[Web App Container]
    A --> C[Admin App Container]
    A --> D[Space App Container]
    A --> E[API Container]

    B --> F[PostgreSQL]
    C --> F
    D --> F
    E --> F

    E --> G[Redis]
    H[Celery Worker] --> F
    H --> G
```

### 步骤 1: 准备生产环境配置

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        - NODE_ENV=production
    environment:
      - VITE_API_BASE_URL=${API_BASE_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped

  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
      args:
        - NODE_ENV=production
    ports:
      - "3001:3001"
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  celery-worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: celery -A plane worker -l info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 步骤 2: 构建生产镜像

```bash
# 构建前端应用
pnpm build

# 构建 Docker 镜像
docker compose -f docker-compose.prod.yml build
```

### 步骤 3: 配置 Nginx 反向代理

创建 `/etc/nginx/sites-available/plane.conf`:

```nginx
upstream plane_web {
    server localhost:3000;
}

upstream plane_admin {
    server localhost:3001;
}

upstream plane_api {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Web App
    location / {
        proxy_pass http://plane_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin App
    location /god-mode/ {
        proxy_pass http://plane_admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://plane_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/plane.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 4: 配置 SSL (Let's Encrypt)

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 步骤 5: 启动生产服务

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 步骤 6: 监控和日志

```bash
# 查看容器状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f api

# 查看资源使用
docker stats
```

---

## 验证部署

### 健康检查

```bash
# 检查 API 健康状态
curl http://localhost:8000/api/health/

# 检查前端应用
curl http://localhost:3000/

# 检查数据库连接
docker compose exec api python manage.py dbshell
```

### 预期输出

**API 健康检查**:
```json
{"status": "ok", "database": "connected", "redis": "connected"}
```

**前端应用**: 返回 HTML 页面

---

## 常见问题

### 问题 1: 内存不足导致构建失败

**原因**: 开发环境需要至少 12GB RAM

**解决方案**:
```bash
# 增加 Docker 内存限制
# Docker Desktop > Settings > Resources > Memory: 12GB

# 或者只启动单个应用
turbo run dev --filter=web
```

### 问题 2: 端口被占用

**原因**: 3000/3001/3002/8000 端口已被其他程序占用

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :8000

# 杀掉进程
kill -9 <PID>

# 或修改 .env 中的端口配置
```

### 问题 3: pnpm install 失败

**原因**: 网络问题或依赖冲突

**解决方案**:
```bash
# 清理缓存
pnpm store prune

# 删除 node_modules 和 lockfile
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### 问题 4: Docker Compose 启动失败

**原因**: 环境变量未正确配置或 Docker 服务未运行

**解决方案**:
```bash
# 检查 Docker 服务状态
systemctl status docker

# 启动 Docker
systemctl start docker

# 检查环境变量
cat .env

# 重新构建
docker compose -f docker-compose-local.yml up --build
```

### 问题 5: 数据库迁移失败

**原因**: 数据库连接失败或迁移文件冲突

**解决方案**:
```bash
# 检查数据库连接
docker compose exec postgres psql -U plane -d plane

# 重置数据库 (警告: 会删除所有数据)
docker compose down -v
docker compose up -d postgres
docker compose exec api python manage.py migrate
```

---

## 最佳实践

- 💡 **开发环境**: 使用 `pnpm dev` 启动热重载，提升开发效率
- 💡 **生产环境**: 始终使用环境变量管理敏感配置，不要硬编码
- 💡 **备份**: 定期备份 PostgreSQL 数据和 Redis 持久化数据
- 💡 **监控**: 配置 Sentry、Prometheus 等监控工具
- 💡 **日志**: 使用集中化日志管理 (ELK Stack、Loki)
- 💡 **更新**: 定期更新依赖和 Docker 镜像，修复安全漏洞
- 💡 **测试**: 部署前在测试环境验证所有功能

---

## 性能优化建议

### 前端优化

```bash
# 分析构建包大小
pnpm exec vite-bundle-visualizer

# 使用 Turbo 缓存
turbo run build --cache-dir=.turbo

# 预加载关键资源
# 在 index.html 中添加 <link rel="preload">
```

### 后端优化

```python
# Django settings.py 生产环境配置

# 启用数据库连接池
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,  # 连接池
    }
}

# 启用 Redis 缓存
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
    }
}

# 启用 Gzip 压缩
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ...
]
```

### 数据库优化

```sql
-- 创建常用查询的索引
CREATE INDEX idx_issue_project ON plane_issue(project_id);
CREATE INDEX idx_issue_assignee ON plane_issue(assignee_id);
CREATE INDEX idx_issue_created ON plane_issue(created_at);

-- 启用查询计划缓存
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

---

## 扩展阅读

### 水平扩展

**前端应用**:
```bash
# 启动多个实例
docker compose up -d --scale web=3

# 配置 Nginx 负载均衡
upstream plane_web {
    server web1:3000;
    server web2:3000;
    server web3:3000;
}
```

**API 服务**:
```bash
# 使用 Gunicorn 多进程
gunicorn plane.wsgi:application \
    --workers 4 \
    --bind 0.0.0.0:8000 \
    --timeout 120
```

### 容器编排 (Kubernetes)

```yaml
# k8s/web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plane-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plane-web
  template:
    metadata:
      labels:
        app: plane-web
    spec:
      containers:
      - name: web
        image: plane/web:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_BASE_URL
          value: "https://api.your-domain.com"
```

---

## 相关文档

- [架构设计](architecture-overview.md)
- [环境变量配置参考](environment-variables.md)
- [故障排查指南](../../04-operations/troubleshooting/common-issues.md)
- [性能优化指南](../../04-operations/maintenance/performance-tuning.md)

---

## 更新历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|---------|------|
| 1.0.0 | 2025-12-30 | 初始版本 | Terry Chen |
