# 操作指南

本目录包含 Plane 项目的操作指南，涵盖部署、配置、集成等实用操作文档。

## 📁 目录结构

```
03-guides/
├── README.md                    # 本文档
├── deployment/                  # 部署指南
│   ├── README.md
│   └── deployment-guide.md      # 完整部署指南 ✅
├── configuration/               # 配置指南 (即将添加)
└── integration/                 # 集成指南 (即将添加)
```

## 📋 文档列表

### 🚀 部署指南 (deployment/)

- **[部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md)** - 完整的部署操作手册
  - 本地开发环境部署
  - Docker Compose 部署
  - 生产环境部署
  - 常见问题排查

### ⚙️ 配置指南 (configuration/) - 即将添加

计划包含的配置文档：
- 环境变量配置
- 数据库配置
- 缓存配置
- 认证配置

### 🔗 集成指南 (integration/) - 即将添加

计划包含的集成文档：
- OAuth 集成
- 第三方服务集成
- API 集成
- Webhook 配置

## 🎯 快速导航

### 按任务类型查找

| 我想... | 推荐文档 |
|--------|---------|
| 搭建开发环境 | [部署指南 - 本地开发环境](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式一-本地开发环境部署) |
| 使用 Docker 部署 | [部署指南 - Docker Compose](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式二-docker-compose-部署) |
| 部署到生产环境 | [部署指南 - 生产环境](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#方式三-生产环境部署) |
| 排查部署问题 | [部署指南 - 常见问题](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#常见问题) |
| 优化性能 | [部署指南 - 性能优化](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md#性能优化建议) |

### 按技能水平查找

| 技能水平 | 推荐阅读路径 |
|---------|------------|
| **新手** | 1. 部署指南 - 前置条件<br>2. 部署指南 - 本地开发环境<br>3. 常见问题 |
| **中级** | 1. Docker Compose 部署<br>2. 性能优化建议<br>3. 架构概览 |
| **高级** | 1. 生产环境部署<br>2. 水平扩展<br>3. Kubernetes 部署 |

## 🛠️ 常用操作快速参考

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动所有服务 (18 个并发)
pnpm dev

# 启动单个应用
turbo run dev --filter=web

# 启动后端服务
docker compose -f docker-compose-local.yml up -d
```

### 生产部署

```bash
# 构建生产镜像
pnpm build
docker compose -f docker-compose.prod.yml build

# 启动生产服务
docker compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker compose ps
```

### 故障排查

```bash
# 查看日志
docker compose logs -f api

# 健康检查
curl http://localhost:8000/api/health/

# 进入容器调试
docker exec -it api sh
```

## 📊 系统要求

### 硬件要求

| 环境 | CPU | 内存 | 磁盘 |
|-----|-----|------|------|
| 开发 | 4 核+ | 12GB+ | 20GB+ |
| 测试 | 2 核+ | 8GB+ | 50GB+ |
| 生产 | 8 核+ | 16GB+ | 100GB+ |

### 软件要求

| 软件 | 版本要求 | 用途 |
|-----|---------|------|
| Node.js | 22.18.0+ | 前端运行时 |
| pnpm | 10.21.0 | 包管理器 |
| Docker | latest | 容器化 |
| Python | 3.8+ | 后端运行时 |
| PostgreSQL | 14+ | 数据库 |
| Redis | 6.2.7+ | 缓存/队列 |

## 📚 相关文档

- [架构概览](architecture-overview.md) - 了解系统架构
- [Docker 快速参考](../Docker快速参考.md) - Docker 命令速查
- [环境变量配置说明](../环境变量配置说明.md) - 环境变量详解

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建操作指南目录，添加部署指南 |

---

**文档维护**: DevOps Team
**最后更新**: 2025-12-30
