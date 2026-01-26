# 部署指南

本目录包含 Plane 项目的部署相关文档，涵盖本地开发环境、Docker 部署、生产环境配置等内容。

## 📋 文档列表

### 核心文档

- **[部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md)** - 完整的部署操作手册
  - 本地开发环境部署
  - Docker Compose 部署
  - 生产环境部署配置
  - 常见问题排查
  - 性能优化建议

## 🚀 快速开始

### 我想快速搭建开发环境

直接查看 [部署指南 - 本地开发环境部署](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式一-本地开发环境部署)

**前置要求**:
- Node.js 22.18.0+
- pnpm 10.21.0
- Docker
- 12GB+ RAM

**快速命令**:
```bash
# 克隆仓库
git clone https://github.com/makeplane/plane.git
cd plane

# 安装依赖
pnpm install

# 启动后端服务
docker compose -f docker-compose-local.yml up -d

# 启动所有开发服务器
pnpm dev
```

### 我想使用 Docker 快速部署

查看 [部署指南 - Docker Compose 部署](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式二-docker-compose-部署)

**快速命令**:
```bash
# 配置环境变量
cp .env.example .env

# 构建并启动
docker compose build
docker compose up -d

# 初始化数据库
docker compose exec api python manage.py migrate
```

### 我想部署到生产环境

查看 [部署指南 - 生产环境部署](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式三-生产环境部署)

**关键步骤**:
1. 准备生产环境配置
2. 构建生产镜像
3. 配置 Nginx 反向代理
4. 配置 SSL 证书
5. 启动和监控服务

## 🔍 常见问题

### 部署遇到错误怎么办？

查看 [部署指南 - 常见问题](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#常见问题)，涵盖：

| 问题类型 | 快速定位 |
|---------|---------|
| 内存不足导致构建失败 | [问题 1](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#问题-1-内存不足导致构建失败) |
| 端口被占用 | [问题 2](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#问题-2-端口被占用) |
| pnpm install 失败 | [问题 3](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#问题-3-pnpm-install-失败) |
| Docker Compose 启动失败 | [问题 4](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#问题-4-docker-compose-启动失败) |
| 数据库迁移失败 | [问题 5](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#问题-5-数据库迁移失败) |

### 如何验证部署成功？

查看 [部署指南 - 验证部署](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#验证部署)

**健康检查命令**:
```bash
# API 健康检查
curl http://localhost:8000/api/health/

# 检查所有服务
docker compose ps

# 查看日志
docker compose logs -f
```

## 📊 部署方式对比

| 部署方式 | 适用场景 | 复杂度 | 启动速度 | 推荐指数 |
|---------|---------|--------|---------|---------|
| 本地开发环境 | 开发和调试 | ⭐⭐ | 快 | ⭐⭐⭐⭐⭐ |
| Docker Compose | 快速测试和演示 | ⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| 生产环境 | 正式部署 | ⭐⭐⭐⭐⭐ | 慢 | ⭐⭐⭐ |

## 🛠️ 常用命令速查

### 开发环境

```bash
# 启动所有服务
pnpm dev

# 启动单个应用
turbo run dev --filter=web

# 查看运行状态
docker compose -f docker-compose-local.yml ps
```

### Docker 环境

```bash
# 构建所有服务
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f api

# 重启服务
docker compose restart api
```

### 生产环境

```bash
# 构建生产镜像
docker compose -f docker-compose.prod.yml build

# 启动生产服务
docker compose -f docker-compose.prod.yml up -d

# 查看资源使用
docker stats

# 备份数据库
docker exec plane-db pg_dump -U plane plane > backup.sql
```

## 🎯 端口配置

| 服务 | 默认端口 | 说明 |
|-----|---------|------|
| Web App | 3000 | 主前端应用 |
| Admin App | 3001 | 管理后台 |
| Space App | 3002 | 公共空间 |
| Django API | 8000 | REST API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存和队列 |
| Nginx (生产) | 80, 443 | 反向代理 |

## 📈 性能优化

查看 [部署指南 - 性能优化建议](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#性能优化建议)

**关键优化点**:
- 前端构建优化 (Vite bundle 分析)
- 后端数据库连接池
- Redis 缓存配置
- Nginx Gzip 压缩
- 数据库索引优化

## 📚 相关文档

- [架构概览](architecture-overview.md) - 了解系统架构
- [Docker 快速参考](../../Docker快速参考.md) - Docker 命令速查
- [环境变量配置说明](../../环境变量配置说明.md) - 环境变量详解
- [Docker 构建问题修复指南](../../Docker构建问题修复指南.md) - 构建问题排查

## 💡 最佳实践

- ✅ **开发环境**: 使用 `pnpm dev` 启动热重载
- ✅ **生产环境**: 使用环境变量管理配置
- ✅ **备份**: 定期备份 PostgreSQL 数据
- ✅ **监控**: 配置日志和性能监控
- ✅ **更新**: 定期更新依赖和镜像
- ✅ **测试**: 部署前在测试环境验证

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建部署指南目录和完整部署文档 |

---

**文档维护**: DevOps Team
**最后更新**: 2025-12-30
