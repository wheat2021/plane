---
title: Plane 技术文档中心
date: 2025-12-12
tags:
  - documentation
  - index
---

# 📚 Plane 技术文档中心

欢迎来到 Plane 项目技术文档中心。本目录包含项目的技术文档、故障排查指南和最佳实践。

## 📖 文档导航

### 🚀 快速开始

- **[Docker 快速参考](./Docker快速参考.md)** - 常用 Docker 命令速查手册
  - 快速启动流程
  - 常用命令集合
  - 故障排查清单
  - 性能监控技巧

### 🔧 故障排查

- **[Docker 构建问题修复指南](./Docker构建问题修复指南.md)** - 详细的问题分析与解决方案
  - PostCSS 配置问题
  - Live 服务环境变量配置
  - Proxy 服务 Caddyfile 配置
  - 完整的解决步骤和验证方法

### ⚙️ 配置管理

- **[环境变量配置说明](./环境变量配置说明.md)** - 环境变量完整指南
  - 运行时配置 vs 构建时配置
  - 各服务环境变量清单
  - 常见配置场景
  - 调试和验证方法

## 🎯 文档使用指南

### 按场景查找

**我需要快速启动项目：**
→ [Docker 快速参考 - 快速启动](./Docker快速参考.md#-快速启动)

**构建过程中遇到错误：**
→ [Docker 构建问题修复指南](./Docker构建问题修复指南.md#-问题分析)

**需要调试特定服务：**
→ [Docker 快速参考 - 故障排查](./Docker快速参考.md#-故障排查)

**查找常用命令：**
→ [Docker 快速参考 - 常用命令](./Docker快速参考.md#-常用命令)

**了解服务架构：**
→ [Docker 构建问题修复指南 - 服务架构](./Docker构建问题修复指南.md#-服务架构)

### 按错误信息查找

| 错误关键词 | 参考文档 | 章节 |
|-----------|---------|------|
| `tailwindcss/nesting` | [构建问题修复指南](./Docker构建问题修复指南.md) | PostCSS 配置修复 |
| `Invalid environment variables` | [构建问题修复指南](./Docker构建问题修复指南.md) | Live 服务配置 |
| `server block without any key` | [构建问题修复指南](./Docker构建问题修复指南.md) | Proxy Caddyfile 修复 |
| `port is already allocated` | [Docker 快速参考](./Docker快速参考.md) | 常见错误速查 |
| `build failed` | [构建问题修复指南](./Docker构建问题修复指南.md) | 问题分析 |

## 📝 文档结构

```
docs/
├── README.md                    # 本文档索引
├── Docker构建问题修复指南.md    # 详细的问题修复文档
├── Docker快速参考.md            # 快速命令参考手册
├── 环境变量配置说明.md          # 环境变量配置指南
├── CHANGES.md                   # 变更记录
├── verify-setup.sh              # 环境验证脚本
└── restart-services.sh          # 服务重启脚本
```

## 🔍 关键概念

### 服务列表

| 服务名 | 说明 | 端口 | 健康检查 |
|--------|------|------|---------|
| **web** | 主前端应用 | 3000 | ✅ |
| **admin** | 管理后台 | 3000 | ✅ |
| **space** | 公共空间 | 3000 | ⚠️ |
| **api** | Django REST API | 8000 | - |
| **live** | WebSocket 服务 | 3000 | - |
| **proxy** | Caddy 反向代理 | 80, 443 | - |
| **worker** | Celery 后台任务 | - | - |
| **beat-worker** | Celery 定时任务 | - | - |
| **plane-db** | PostgreSQL | 5432 | - |
| **plane-redis** | Valkey/Redis | 6379 | - |
| **plane-minio** | MinIO 对象存储 | 9000 | - |
| **plane-mq** | RabbitMQ | 5672 | - |

### 访问地址

- **主应用**: http://localhost:80/
- **管理后台**: http://localhost:80/god-mode/
- **Space 应用**: http://localhost:80/spaces/
- **API 文档**: http://localhost:80/api/docs/

## 🛠️ 常用操作

### 日常开发

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f api

# 重启某个服务
docker compose restart api
```

### 问题调试

```bash
# 查看构建错误
docker compose build admin 2>&1 | grep -i error

# 进入容器调试
docker exec -it api sh

# 检查网络连接
docker exec api ping plane-redis
```

### 数据管理

```bash
# 备份数据库
docker exec plane-db pg_dump -U plane plane > backup.sql

# 恢复数据库
docker exec -i plane-db psql -U plane plane < backup.sql

# 清理系统（⚠️ 谨慎使用）
docker system prune -a
```

### 环境变量修改

```bash
# 修改后端环境变量（重启生效）
vim apps/api/.env
bash docs/restart-services.sh --backend

# 修改前端环境变量（需要重新构建）
vim apps/web/.env
bash docs/restart-services.sh --frontend

# 查看详细说明
cat docs/环境变量配置说明.md
```

## 📚 相关资源

### 项目文档

- [CLAUDE.md](../CLAUDE.md) - Claude Code 使用指南
- [README.md](../README.md) - 项目主文档
- [package.json](../package.json) - 依赖配置

### 外部资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/)
- [Caddy 文档](https://caddyserver.com/docs/)
- [pnpm 工作区](https://pnpm.io/workspaces)
- [Tailwind CSS v3](https://tailwindcss.com/docs)

## 🤝 贡献指南

### 更新文档

发现问题或需要补充时：

1. **编辑现有文档**
   - 直接修改 Markdown 文件
   - 保持格式一致性
   - 更新修订历史

2. **添加新文档**
   - 使用 Obsidian 风格的 Markdown
   - 添加适当的 frontmatter
   - 在本 README 中添加索引

3. **文档规范**
   - 使用清晰的标题结构
   - 代码示例使用代码块
   - 添加必要的警告和提示
   - 包含实际的命令和输出

### Frontmatter 模板

```yaml
---
title: 文档标题
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
category: 分类
status: draft/completed/archived
---
```

## 🏷️ 标签系统

文档使用以下标签分类：

- `#docker` - Docker 相关
- `#troubleshooting` - 故障排查
- `#deployment` - 部署相关
- `#quickstart` - 快速开始
- `#cheatsheet` - 速查手册
- `#build-fix` - 构建修复
- `#configuration` - 配置说明

## 📊 文档状态

| 文档 | 状态 | 最后更新 | 验证 |
|------|------|---------|------|
| Docker 构建问题修复指南 | ✅ 完成 | 2025-12-12 | ✅ 已验证 |
| Docker 快速参考 | ✅ 完成 | 2025-12-12 | ✅ 已验证 |

## 💡 使用提示

> [!tip] Obsidian 用户
> 这些文档使用 Obsidian 风格的 Markdown 编写，建议使用 Obsidian 打开以获得最佳阅读体验：
> - 支持内部链接跳转
> - 支持标签检索
> - 支持图表渲染
> - 支持 Callout 块

> [!note] VSCode 用户
> 推荐安装以下插件以获得更好的阅读体验：
> - Markdown All in One
> - Markdown Preview Enhanced
> - Mermaid Preview

## 🔄 更新日志

### 2025-12-12

- ✨ 创建文档中心
- 📝 添加 Docker 构建问题修复指南
- 📝 添加 Docker 快速参考手册
- 🎯 建立文档索引和导航系统

---

## 📞 获取帮助

遇到问题？

1. 📖 先查阅相关文档
2. 🔍 在文档中搜索错误信息
3. 🐛 查看 [Issues](https://github.com/makeplane/plane/issues)
4. 💬 联系团队成员

---

**文档维护：** DevOps Team
**最后更新：** 2025-12-12
**版本：** 1.0

#documentation #index #plane
