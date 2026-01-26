# 参考文档

本目录包含 Plane 项目的参考文档，提供快速查询和详细说明。

## 📁 目录结构

```
05-reference/
├── README.md                          # 本文档
├── docker-quick-reference.md          # Docker 快速参考 ✅
├── configuration/                     # 配置参考
│   ├── README.md
│   └── environment-variables.md       # 环境变量配置说明 ✅
└── api/                               # API 参考
    ├── README.md
    ├── work-item-types-verification.md   # API 验证报告 ✅
    └── work-item-types-implementation.md # API 实现总结 ✅
```

## 📋 文档分类

### 🐳 Docker 参考

- **[Docker 快速参考](docker-quick-reference.md)** - Docker 命令速查手册
  - 快速启动流程
  - 常用命令集合
  - 故障排查清单
  - 性能监控技巧

### ⚙️ 配置参考 (configuration/)

- **[环境变量配置说明](environment-variables.md)** - 完整的环境变量参考
  - 运行时配置 vs 构建时配置
  - 各服务环境变量清单
  - 常见配置场景
  - 调试和验证方法

### 📡 API 参考 (api/)

- **[Work Item Types API 验证报告](work-item-types-verification.md)** - 后端 API 实现情况验证
  - 数据模型验证
  - API 视图和序列化器检查
  - URL 路由配置验证

- **[Work Item Types API 实现总结](work-item-types-implementation.md)** - 完整的 API 实现记录
  - 序列化器实现
  - API 端点和路由
  - 数据迁移脚本

## 🎯 快速查找

### 按用途查找

| 我想... | 推荐文档 |
|--------|---------|
| 查找 Docker 命令 | [Docker 快速参考](docker-quick-reference.md) |
| 了解环境变量 | [环境变量配置说明](environment-variables.md) |
| 查看 API 实现 | [API 参考文档](./api/) |
| 快速启动服务 | [Docker 快速参考 - 快速启动](docker-quick-reference.md) |

### 按文档类型查找

| 文档类型 | 用途 | 位置 |
|---------|------|------|
| **速查手册** | 快速查找常用命令 | Docker 快速参考 |
| **配置参考** | 详细的配置说明 | configuration/ |
| **API 文档** | API 设计和实现 | api/ |
| **开发笔记** | 开发过程记录 | api/ 验证报告和实现总结 |

## 📊 Docker 命令速查

### 常用命令

```bash
# 构建和启动
docker compose build
docker compose up -d

# 服务管理
docker compose ps
docker compose logs -f api
docker compose restart api

# 清理
docker compose down
docker system prune -a
```

### 故障排查

```bash
# 查看日志
docker compose logs -f [service]

# 进入容器
docker exec -it [container] bash

# 检查网络
docker compose exec api ping plane-db

# 查看资源使用
docker stats
```

## 📚 相关文档

- [部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md) - 部署操作手册
- [故障排查](../04-operations/troubleshooting/) - 问题排查指南
- [架构设计](../02-architecture/) - 系统架构文档

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建参考文档目录，整理 Docker、配置和 API 参考文档 |

---

**文档维护**: DevOps & Dev Team
**最后更新**: 2025-12-30
