---
title: Docker 快速参考指南
date: 2025-12-12
tags:
  - docker
  - quickstart
  - cheatsheet
category: DevOps
---

# Docker 快速参考指南

> [!abstract] 快速索引
> 本文档提供 Plane 项目 Docker 环境的常用命令和快速故障排查方法。

## 🚀 快速启动

```bash
# 完整启动流程
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
```

## 📦 常用命令

### 构建相关

```bash
# 构建所有服务
docker compose build

# 构建特定服务
docker compose build admin web api

# 强制重新构建（不使用缓存）
docker compose build --no-cache admin

# 并行构建
docker compose build --parallel
```

### 服务管理

```bash
# 启动所有服务
docker compose up -d

# 启动特定服务
docker compose up -d api web admin

# 停止所有服务
docker compose down

# 停止但保留 volumes
docker compose stop

# 重启服务
docker compose restart api

# 强制重新创建容器
docker compose up -d --force-recreate proxy
```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs api

# 实时跟踪日志
docker compose logs -f api

# 查看最近 50 行日志
docker logs api --tail 50

# 查看带时间戳的日志
docker compose logs -t api
```

### 服务状态

```bash
# 查看所有服务状态
docker compose ps

# 查看详细状态
docker compose ps -a

# 查看资源使用
docker stats

# 查看特定容器详情
docker inspect api
```

## 🔍 故障排查

### 快速诊断

```bash
# 1. 检查服务状态
docker compose ps

# 2. 查看失败服务日志
docker compose logs <服务名>

# 3. 进入容器调试
docker exec -it <容器名> sh

# 4. 检查网络连接
docker exec api ping plane-redis
docker exec api curl http://plane-db:5432
```

### 服务特定检查

**Admin/Web/Space 构建失败：**
```bash
# 查看构建日志
docker compose build admin 2>&1 | grep -i error

# 检查 PostCSS 配置
cat packages/tailwind-config/postcss.config.js

# 验证 Tailwind 版本
docker run --rm plane-admin grep tailwindcss package.json
```

**Proxy 持续重启：**
```bash
# 查看 proxy 日志
docker logs proxy --tail 50

# 验证 Caddyfile
docker run --rm \
  -e SITE_ADDRESS=":80" \
  -e TRUSTED_PROXIES="0.0.0.0/0" \
  -e FILE_SIZE_LIMIT="5242880" \
  -e BUCKET_NAME="uploads" \
  plane-proxy caddy validate --config /etc/caddy/Caddyfile

# 检查环境变量
docker inspect proxy | jq '.[0].Config.Env'
```

**Live 服务启动失败：**
```bash
# 查看环境变量
docker exec plane-live env | grep -E "API_BASE_URL|LIVE_SERVER_SECRET_KEY"

# 检查 Redis 连接
docker exec plane-live ping plane-redis
```

**API 服务问题：**
```bash
# 查看 Django 日志
docker logs api --tail 100

# 检查数据库连接
docker exec api python manage.py check

# 运行迁移
docker exec api python manage.py migrate

# 进入 Django shell
docker exec -it api python manage.py shell
```

## 🧹 清理与维护

### 清理命令

```bash
# 停止并删除所有容器
docker compose down

# 删除容器和 volumes（⚠️ 会删除数据）
docker compose down -v

# 清理未使用的镜像
docker image prune -a

# 清理所有未使用资源
docker system prune -a --volumes

# 查看磁盘使用
docker system df
```

### 数据备份

```bash
# 备份数据库
docker exec plane-db pg_dump -U plane plane > backup_$(date +%Y%m%d).sql

# 备份 volume
docker run --rm -v plane_pgdata:/data -v $(pwd):/backup \
  alpine tar czf /backup/pgdata_$(date +%Y%m%d).tar.gz /data

# 恢复数据库
docker exec -i plane-db psql -U plane plane < backup_20251212.sql
```

## 🌐 访问测试

```bash
# 测试主应用
curl -I http://localhost:80/

# 测试管理后台
curl -I http://localhost:80/god-mode/

# 测试 Space 应用
curl -I http://localhost:80/spaces/

# 测试 API
curl http://localhost:80/api/health/

# 测试 MinIO
curl http://localhost:80/uploads/
```

## 🐛 常见错误速查

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `Cannot find module 'tailwindcss/nesting'` | PostCSS 配置错误 | 参考[[Docker构建问题修复指南#1. PostCSS 配置修复]] |
| `Invalid environment variables` | 环境变量缺失 | 检查 docker-compose.yml 和 .env 文件 |
| `server block without any key` | Caddyfile 语法错误 | 全局配置块必须在文件开头 |
| `port is already allocated` | 端口冲突 | `lsof -i :80` 查找占用进程 |
| `no space left on device` | 磁盘空间不足 | `docker system prune -a` 清理空间 |
| `OOM killed` | 内存不足 | 增加 Docker 内存限制或系统内存 |

## 📊 性能监控

```bash
# 实时资源监控
docker stats

# 查看特定容器资源
docker stats api web admin

# 查看日志大小
du -sh /var/lib/docker/containers/*/*-json.log

# 限制日志大小（docker-compose.yml）
# logging:
#   driver: "json-file"
#   options:
#     max-size: "10m"
#     max-file: "3"
```

## 🔧 开发技巧

### 热重载开发

```bash
# 使用开发配置（如果有）
docker compose -f docker-compose-local.yml up -d

# 挂载本地代码到容器
# volumes:
#   - ./apps/web:/app/apps/web
```

### 重建单个服务

```bash
# 只重建变更的服务
docker compose up -d --build api

# 强制重建并重启
docker compose build --no-cache api && \
docker compose up -d --force-recreate api
```

### 查看构建层

```bash
# 查看镜像历史
docker history plane-admin

# 查看镜像大小
docker images | grep plane
```

## 📋 健康检查

```bash
# 检查所有服务健康状态
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# 手动触发健康检查
docker exec api curl -f http://localhost:8000/health/ || exit 1

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' api | jq
```

## 🔐 安全检查

```bash
# 检查暴露的端口
docker compose ps --format "table {{.Name}}\t{{.Ports}}"

# 检查环境变量（注意敏感信息）
docker compose config

# 扫描镜像漏洞（需要 Docker Scout）
docker scout cves plane-api
```

## 💡 提示技巧

> [!tip] 快捷别名
> 添加到 `.bashrc` 或 `.zshrc`：
> ```bash
> alias dcp='docker compose -f docker-compose.yml'
> alias dcps='docker compose ps'
> alias dcl='docker compose logs'
> alias dce='docker compose exec'
> alias dcb='docker compose build'
> alias dcu='docker compose up -d'
> alias dcd='docker compose down'
> ```

> [!warning] 注意事项
> - 生产环境避免使用 `--force-recreate`
> - `down -v` 会删除所有数据，谨慎使用
> - 定期备份 PostgreSQL 数据
> - 监控磁盘空间，定期清理日志

## 📖 相关文档

- [[Docker构建问题修复指南]] - 详细的问题修复说明
- [[项目架构说明]] - 系统架构和服务关系
- [[环境变量配置清单]] - 完整的环境变量说明

---

**最后更新：** 2025-12-12
**维护者：** DevOps Team

#docker #cheatsheet #quickstart
