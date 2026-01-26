# 运维手册

本目录包含 Plane 项目的运维相关文档，涵盖日常维护、故障排查、监控告警等内容。

## 📁 目录结构

```
04-operations/
├── README.md                    # 本文档
├── troubleshooting/             # 故障排查
│   ├── README.md
│   ├── docker-build-issues.md   # Docker 构建问题修复 ✅
│   └── minio-remote-access.md   # MinIO 远程访问修复 ✅
└── maintenance/                 # 维护手册 (即将添加)
```

## 📋 文档分类

### 🔧 故障排查 (troubleshooting/)

- **[Docker 构建问题修复指南](docker-build-issues.md)**
  - PostCSS 配置问题
  - Live 服务环境变量配置
  - Proxy 服务 Caddyfile 配置
  - 完整的解决步骤和验证方法

- **[MinIO 远程访问修复](minio-remote-access.md)**
  - 连接失败问题分析
  - 环境变量配置修复
  - 网络访问验证

### 🛠️ 日常维护 (maintenance/) - 即将添加

计划包含的维护文档：
- 数据库备份和恢复
- 日志管理
- 性能优化
- 安全更新

## 🎯 快速导航

### 按问题类型查找

| 问题类型 | 推荐文档 |
|---------|---------|
| Docker 构建失败 | [Docker 构建问题修复](docker-build-issues.md) |
| 文件上传失败 | [MinIO 远程访问修复](minio-remote-access.md) |
| 服务启动失败 | [Docker 构建问题修复](docker-build-issues.md) |
| 跨域访问错误 | [环境变量配置示例](environment-variables-examples.md) |

### 按服务查找

| 服务 | 相关文档 |
|-----|---------|
| Admin/Web/Space | [Docker 构建问题](docker-build-issues.md) |
| MinIO | [MinIO 远程访问](minio-remote-access.md) |
| Proxy (Caddy) | [Docker 构建问题](docker-build-issues.md) |
| Live (WebSocket) | [Docker 构建问题](docker-build-issues.md) |

## 🚨 常见问题速查

### 构建相关

```bash
# PostCSS 配置错误
Error: Cannot find module 'tailwindcss/nesting'
→ 参考: docker-build-issues.md

# 环境变量未配置
Invalid environment variables
→ 参考: docker-build-issues.md
```

### 运行时问题

```bash
# 端口冲突
Error: port is already allocated
→ 使用: docker compose down && docker compose up -d

# 文件上传失败
POST http://localhost:9000/uploads net::ERR_CONNECTION_REFUSED
→ 参考: minio-remote-access.md
```

## 📚 相关文档

- [部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md) - 部署过程中的问题预防
- [Docker 快速参考](docker-quick-reference.md) - Docker 常用命令
- [环境变量配置说明](environment-variables.md) - 环境变量参考

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建运维手册目录，整理故障排查文档 |

---

**文档维护**: DevOps Team
**最后更新**: 2025-12-30
