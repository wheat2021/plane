---
title: 环境变量修改实战示例
description: Plane 项目环境变量修改的实用场景和步骤指南,可直接复制使用
category: guides/configuration
tags: [configuration, examples, howto, deployment]
author: Claude Code Assistant
created: 2025-12-12
updated: 2025-12-30
version: 1.0.0
status: active
---

# 环境变量修改实战示例

> [!example] 实用场景
> 本文档提供真实场景下的环境变量修改步骤，可以直接复制使用。

## 🎯 场景 1: 从本地切换到公网访问

**需求**: 将服务从 `localhost` 切换到公网 IP `107.174.155.181`

### 步骤

```bash
# 1. 修改前端环境变量（3个文件）
cat > apps/web/.env << 'EOF'
VITE_API_BASE_URL="http://107.174.155.181"
VITE_WEB_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_PATH="/god-mode"
VITE_SPACE_BASE_URL="http://107.174.155.181"
VITE_SPACE_BASE_PATH="/spaces"
VITE_LIVE_BASE_URL="http://107.174.155.181"
VITE_LIVE_BASE_PATH="/live"
EOF

cat > apps/admin/.env << 'EOF'
VITE_API_BASE_URL="http://107.174.155.181"
VITE_WEB_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_PATH="/god-mode"
VITE_SPACE_BASE_URL="http://107.174.155.181"
VITE_SPACE_BASE_PATH="/spaces"
VITE_LIVE_BASE_URL="http://107.174.155.181"
VITE_LIVE_BASE_PATH="/live"
EOF

cat > apps/space/.env << 'EOF'
VITE_API_BASE_URL="http://107.174.155.181"
VITE_WEB_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_URL="http://107.174.155.181"
VITE_ADMIN_BASE_PATH="/god-mode"
VITE_SPACE_BASE_URL="http://107.174.155.181"
VITE_SPACE_BASE_PATH="/spaces"
VITE_LIVE_BASE_URL="http://107.174.155.181"
VITE_LIVE_BASE_PATH="/live"
EOF

# 2. 重新构建前端服务（⚠️ 需要 5-10 分钟）
docker compose build web admin space

# 3. 重启前端服务
docker compose up -d web admin space

# 4. 验证
curl -I http://107.174.155.181/
curl -I http://107.174.155.181/god-mode/
```

---

## 🎯 场景 2: 修改 Live 服务密钥

**需求**: 更新 WebSocket 服务的安全密钥

### 步骤

```bash
# 1. 修改 Live 环境变量
vim apps/live/.env
# 修改: LIVE_SERVER_SECRET_KEY="your-new-secret-key"

# 或者使用命令行直接替换
sed -i 's/LIVE_SERVER_SECRET_KEY=.*/LIVE_SERVER_SECRET_KEY="my-super-secret-key"/' apps/live/.env

# 2. 更新主配置文件（可选）
vim .env
# 修改: LIVE_SERVER_SECRET_KEY=my-super-secret-key

# 3. 只需重启 Live 服务（✅ 无需重新构建）
docker compose restart plane-live

# 4. 验证
docker logs plane-live --tail 20
```

---

## 🎯 场景 3: 修改数据库配置

**需求**: 更改数据库连接信息

### 步骤

```bash
# 1. 修改主配置
vim .env
# 修改以下内容:
# POSTGRES_USER=newuser
# POSTGRES_PASSWORD=newpassword
# POSTGRES_DB=plane

# 2. 修改 API 配置中的连接字符串
vim apps/api/.env
# 修改: DATABASE_URL=postgresql://newuser:newpassword@plane-db:5432/plane

# 3. 重启相关服务（✅ 无需重新构建）
docker compose restart plane-db api bgworker beatworker

# 4. 验证数据库连接
docker exec api python manage.py check
```

> [!warning] 数据库密码修改注意
> 修改数据库密码后，旧的数据可能无法访问。建议：
> 1. 先备份数据：`docker exec plane-db pg_dump -U plane plane > backup.sql`
> 2. 修改配置并重启
> 3. 如果失败，可以恢复配置或重新导入数据

---

## 🎯 场景 4: 启用自定义域名 HTTPS

**需求**: 使用域名 `plane.example.com` 并自动申请 SSL 证书

### 步骤

```bash
# 1. 修改主配置
cat >> .env << 'EOF'
# HTTPS 配置
SITE_ADDRESS=plane.example.com
CERT_EMAIL=admin@example.com
EOF

# 2. 修改前端环境变量使用域名
sed -i 's|http://107.174.155.181|https://plane.example.com|g' apps/web/.env
sed -i 's|http://107.174.155.181|https://plane.example.com|g' apps/admin/.env
sed -i 's|http://107.174.155.181|https://plane.example.com|g' apps/space/.env

# 3. 确保域名已解析到服务器 IP
dig plane.example.com +short
# 应该返回你的服务器 IP

# 4. 重启 Proxy（Caddy 会自动申请证书）
docker compose restart proxy

# 5. 重新构建前端
docker compose build web admin space
docker compose up -d web admin space

# 6. 查看证书申请日志
docker logs proxy -f
# 应该看到 "certificate obtained successfully"

# 7. 验证 HTTPS
curl -I https://plane.example.com/
```

---

## 🎯 场景 5: 使用外部 Redis

**需求**: 使用云服务提供的 Redis 实例

### 步骤

```bash
# 1. 修改 API 配置
vim apps/api/.env
# 修改: REDIS_URL=redis://my-redis.cloud.example.com:6379/

# 2. 修改 Live 配置
vim apps/live/.env
# 修改:
# REDIS_HOST=my-redis.cloud.example.com
# REDIS_PORT=6379
# REDIS_URL=redis://my-redis.cloud.example.com:6379/

# 3. 修改主配置
vim .env
# 修改:
# REDIS_HOST=my-redis.cloud.example.com
# REDIS_PORT=6379

# 4. （可选）停止本地 Redis
# 编辑 docker-compose.yml，注释掉 plane-redis 服务

# 5. 重启相关服务
docker compose restart api bgworker beatworker plane-live

# 6. 验证连接
docker exec api python -c "import redis; r = redis.from_url('redis://my-redis.cloud.example.com:6379/'); print(r.ping())"
# 应该返回: True
```

---

## 🎯 场景 6: 修改文件上传大小限制

**需求**: 允许上传最大 50MB 的文件

### 步骤

```bash
# 1. 修改主配置
vim .env
# 修改: FILE_SIZE_LIMIT=52428800  # 50MB = 50 * 1024 * 1024

# 2. 重启 Proxy（✅ 无需重新构建）
docker compose restart proxy

# 3. 验证配置
docker exec proxy env | grep FILE_SIZE_LIMIT
# 应该显示: FILE_SIZE_LIMIT=52428800

# 4. 测试上传（使用 curl）
# dd if=/dev/zero of=test_50mb.bin bs=1M count=50
# curl -X POST -F "file=@test_50mb.bin" http://localhost/api/upload/
```

---

## 🎯 场景 7: 快速切换到开发模式

**需求**: 在本地开发环境中运行，连接到本地服务

### 步骤

```bash
# 1. 创建开发环境配置
cat > apps/web/.env.development << 'EOF'
VITE_API_BASE_URL="http://localhost:8000"
VITE_WEB_BASE_URL="http://localhost:3000"
VITE_ADMIN_BASE_URL="http://localhost:3001"
VITE_ADMIN_BASE_PATH="/god-mode"
VITE_SPACE_BASE_URL="http://localhost:3002"
VITE_SPACE_BASE_PATH="/spaces"
VITE_LIVE_BASE_URL="http://localhost:3100"
VITE_LIVE_BASE_PATH="/live"
EOF

# 2. 复制到生产配置
cp apps/web/.env.development apps/web/.env
cp apps/web/.env.development apps/admin/.env
cp apps/web/.env.development apps/space/.env

# 3. 修改 Live 配置
cat > apps/live/.env << 'EOF'
PORT=3100
API_BASE_URL="http://localhost:8000"
WEB_BASE_URL="http://localhost:3000"
LIVE_BASE_URL="http://localhost:3100"
LIVE_BASE_PATH="/live"
LIVE_SERVER_SECRET_KEY="secret-key"
REDIS_PORT=6379
REDIS_HOST=localhost
REDIS_URL="redis://localhost:6379/"
EOF

# 4. 重新构建
bash docs/restart-services.sh --frontend

# 5. 重启后端
bash docs/restart-services.sh --backend
```

---

## 🎯 场景 8: 一键切换环境

**需求**: 快速在开发、测试、生产环境间切换

### 创建环境切换脚本

```bash
cat > switch-env.sh << 'EOF'
#!/bin/bash

ENV=$1

if [ -z "$ENV" ]; then
    echo "用法: bash switch-env.sh [dev|test|prod]"
    exit 1
fi

case $ENV in
    dev)
        BASE_URL="http://localhost"
        ;;
    test)
        BASE_URL="http://192.168.1.100"
        ;;
    prod)
        BASE_URL="http://107.174.155.181"
        ;;
    *)
        echo "未知环境: $ENV"
        exit 1
        ;;
esac

echo "切换到 $ENV 环境 ($BASE_URL)..."

# 更新前端配置
for app in web admin space; do
    cat > apps/$app/.env << EOF
VITE_API_BASE_URL="$BASE_URL"
VITE_WEB_BASE_URL="$BASE_URL"
VITE_ADMIN_BASE_URL="$BASE_URL"
VITE_ADMIN_BASE_PATH="/god-mode"
VITE_SPACE_BASE_URL="$BASE_URL"
VITE_SPACE_BASE_PATH="/spaces"
VITE_LIVE_BASE_URL="$BASE_URL"
VITE_LIVE_BASE_PATH="/live"
EOF
done

echo "✓ 环境变量已更新"
echo "重新构建前端服务..."
docker compose build web admin space
docker compose up -d web admin space

echo "✓ 切换完成！"
echo "访问地址: $BASE_URL"
EOF

chmod +x switch-env.sh

# 使用方法：
# bash switch-env.sh dev   # 切换到开发环境
# bash switch-env.sh test  # 切换到测试环境
# bash switch-env.sh prod  # 切换到生产环境
```

---

## 📊 环境变量修改对照表

| 修改内容 | 影响服务 | 配置文件 | 需要重建 | 重启命令 |
|---------|---------|---------|---------|---------|
| 外部访问地址 | 前端 | `apps/{web,admin,space}/.env` | ✅ 是 | `bash docs/restart-services.sh -f` |
| API 地址 | 前端 | `apps/{web,admin,space}/.env` | ✅ 是 | `bash docs/restart-services.sh -f` |
| 数据库连接 | 后端 | `apps/api/.env` | ❌ 否 | `docker compose restart api` |
| Redis 连接 | 后端 | `apps/api/.env`, `apps/live/.env` | ❌ 否 | `bash docs/restart-services.sh -b` |
| Live 密钥 | Live | `apps/live/.env` | ❌ 否 | `docker compose restart plane-live` |
| 上传大小限制 | Proxy | `.env` | ❌ 否 | `docker compose restart proxy` |
| HTTPS 域名 | Proxy | `.env` | ❌ 否 | `docker compose restart proxy` |
| MinIO 密钥 | MinIO | `.env` | ❌ 否 | `docker compose restart plane-minio` |

---

## 🔍 验证环境变量是否生效

### 前端环境变量验证

```bash
# 方法 1: 在浏览器中检查
# 打开浏览器开发者工具 -> Console
# 输入: window.location.href
# 查看是否指向正确的地址

# 方法 2: 检查构建产物中的环境变量
docker exec web grep -r "VITE_API_BASE_URL" /usr/share/nginx/html/assets/*.js | head -1
# 应该显示你设置的 URL

# 方法 3: 查看网页源代码
curl http://localhost/ | grep -o 'VITE_[^"]*' | sort -u
```

### 后端环境变量验证

```bash
# 方法 1: 直接查看容器环境变量
docker exec api env | grep DATABASE_URL

# 方法 2: 通过 Python 检查
docker exec api python -c "import os; print(os.environ.get('DATABASE_URL'))"

# 方法 3: 检查 Django 配置
docker exec api python manage.py diffsettings | grep DATABASE
```

### Live 服务验证

```bash
# 查看 Live 服务环境变量
docker exec plane-live env | grep -E "API_BASE_URL|REDIS_URL|LIVE_SERVER_SECRET_KEY"

# 通过 Node.js 检查
docker exec plane-live node -e "console.log(process.env.API_BASE_URL)"
```

---

## 💡 最佳实践

### 1. 使用环境变量文件模板

```bash
# 为不同环境创建模板
cp apps/web/.env apps/web/.env.production
cp apps/web/.env apps/web/.env.development
cp apps/web/.env apps/web/.env.testing

# 使用时复制
cp apps/web/.env.production apps/web/.env
```

### 2. 版本控制

```bash
# .gitignore 中排除实际配置文件
echo "*.env" >> .gitignore
echo "!*.env.example" >> .gitignore

# 提交模板文件
git add apps/web/.env.example
git commit -m "Add environment template"
```

### 3. 自动化验证

```bash
# 修改后自动验证
vim apps/api/.env
bash docs/verify-setup.sh
```

### 4. 备份重要配置

```bash
# 创建配置备份目录
mkdir -p backups/env-$(date +%Y%m%d)

# 备份所有 .env 文件
find . -name ".env" -not -path "*/node_modules/*" -exec cp {} backups/env-$(date +%Y%m%d)/ \;
```

---

## 🚨 常见错误

### 错误 1: 修改前端 .env 后未重新构建

**症状**: 前端显示的 API 地址仍然是旧的

**解决**:
```bash
docker compose build web admin space
docker compose up -d web admin space
```

### 错误 2: 环境变量优先级混淆

**症状**: 修改了 .env 文件但不生效

**原因**: `docker-compose.yml` 中的 `environment` 优先级更高

**解决**: 检查并修改 `docker-compose.yml` 中的环境变量

### 错误 3: 容器内外地址混用

**症状**: 服务无法连接

**原因**: 容器间通信应使用服务名，外部访问使用 IP/域名

**解决**:
```bash
# 容器内部通信（docker-compose.yml）
API_BASE_URL=http://api:8000

# 外部访问（apps/web/.env）
VITE_API_BASE_URL=http://107.174.155.181
```

---

**最后更新**: 2025-12-12
**维护者**: DevOps Team

#examples #configuration #howto #docker
