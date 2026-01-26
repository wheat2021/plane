# 配置参考文档

本目录包含 Plane 项目配置的详细参考文档。

## 📋 文档列表

- **[环境变量配置说明](environment-variables.md)** - 完整的环境变量参考手册
  - 运行时配置 vs 构建时配置说明
  - 各服务环境变量清单详解
  - 常见配置场景和示例
  - 调试和验证方法

## 🎯 配置类型

### 运行时配置 (重启生效)

以下服务支持运行时环境变量，修改后**只需重启**即可生效：

| 服务 | 配置文件 | 重启命令 |
|------|---------|---------|
| **API** | `apps/api/.env` | `docker compose restart api` |
| **Worker** | `apps/api/.env` | `docker compose restart bgworker` |
| **Beat Worker** | `apps/api/.env` | `docker compose restart beatworker` |
| **Migrator** | `apps/api/.env` | `docker compose restart plane-migrator` |
| **Live** | `apps/live/.env` | `docker compose restart plane-live` |
| **Proxy** | `.env` | `docker compose restart proxy` |

### 构建时配置 (需要重新构建)

以下服务的环境变量在**构建时**烘焙到静态文件中，修改后**必须重新构建镜像**：

| 服务 | 配置文件 | 重新构建命令 |
|------|---------|------------|
| **Web** | `apps/web/.env` | `docker compose up -d --build web` |
| **Admin** | `apps/admin/.env` | `docker compose up -d --build admin` |
| **Space** | `apps/space/.env` | `docker compose up -d --build space` |

## 🔑 核心环境变量

### 数据库配置

```bash
POSTGRES_USER=plane          # PostgreSQL 用户名
POSTGRES_DB=plane            # 数据库名
POSTGRES_PASSWORD=***        # 数据库密码 (生产环境使用强密码)
DATABASE_URL=postgresql://plane:***@plane-db:5432/plane
```

### 缓存和队列

```bash
REDIS_URL=redis://plane-redis:6379/
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=***
RABBITMQ_VHOST=/
```

### 对象存储 (MinIO)

```bash
AWS_ACCESS_KEY_ID=access-key
AWS_SECRET_ACCESS_KEY=secret-key
AWS_S3_BUCKET_NAME=uploads
AWS_S3_ENDPOINT_URL=http://plane-minio:9000
USE_MINIO=1                  # 启用 MinIO
```

### Django 配置

```bash
SECRET_KEY=***               # Django 密钥 (50字符随机字符串)
DEBUG=0                      # 生产环境设置为 0
ALLOWED_HOSTS=*
```

### 前端配置 (构建时)

```bash
VITE_API_BASE_URL=http://localhost:80
VITE_WEB_BASE_URL=http://localhost:80
VITE_ADMIN_BASE_URL=http://localhost:80
VITE_ADMIN_BASE_PATH=/god-mode
VITE_SPACE_BASE_URL=http://localhost:80
VITE_SPACE_BASE_PATH=/spaces
```

## 📝 配置文件位置

```
plane/
├── .env                      # 根配置 (基础设施)
└── apps/
    ├── api/.env              # API 服务配置
    ├── web/.env              # Web 应用配置
    ├── admin/.env            # Admin 应用配置
    ├── space/.env            # Space 应用配置
    └── live/.env             # Live 服务配置
```

## 🛠️ 配置验证

### 检查配置有效性

```bash
# 验证 Docker Compose 配置
docker compose config

# 检查环境变量
docker compose exec api env | grep -E "POSTGRES|REDIS|SECRET"

# 测试数据库连接
docker compose exec api python manage.py dbshell
```

### 常见配置错误

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| 数据库连接失败 | `DATABASE_URL` 配置错误 | 检查主机名、端口、密码 |
| 跨域错误 | 前端 `VITE_*` 配置不匹配 | 更新环境变量并重新构建 |
| MinIO 访问失败 | `AWS_S3_ENDPOINT_URL` 配置错误 | 检查 MinIO 服务地址 |
| Secret key 错误 | `SECRET_KEY` 未配置 | 运行 `./setup.sh` 生成密钥 |

## 💡 最佳实践

- ✅ **不要提交 .env**: 将 `.env` 添加到 `.gitignore`
- ✅ **使用强密码**: 生产环境使用强随机密码
- ✅ **环境隔离**: 开发、测试、生产使用不同配置
- ✅ **定期轮换**: 定期更新 `SECRET_KEY` 等敏感密钥
- ✅ **文档同步**: 修改配置后更新文档

## 📚 相关文档

- [环境变量配置说明](environment-variables.md) - 详细的环境变量说明
- [环境变量修改示例](environment-variables-examples.md) - 实用配置示例
- [部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md) - 部署过程中的配置

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建配置参考目录，整理环境变量文档 |

---

**文档维护**: DevOps Team
**最后更新**: 2025-12-30
