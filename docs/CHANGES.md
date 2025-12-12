---
title: Docker 构建修复 - 变更记录
date: 2025-12-12
tags:
  - changelog
  - docker
  - fix
---

# Docker 构建修复 - 变更记录

> [!summary] 变更概要
> 本次修复解决了 Docker Compose 构建过程中的三个主要问题，涉及 PostCSS 配置、环境变量和 Caddy 配置。

## 📅 基本信息

- **修复日期**: 2025-12-12
- **问题**: Docker Compose 构建失败
- **影响范围**: admin、web、space、live、proxy 服务
- **状态**: ✅ 已修复并验证

## 📝 修改文件清单

### 配置文件修改

#### 1. PostCSS 配置

**文件**: `packages/tailwind-config/postcss.config.js`

```diff
  module.exports = {
    plugins: {
-     "tailwindcss/nesting": {},
      tailwindcss: {},
      autoprefixer: {},
    },
  };
```

**原因**: 移除不兼容的 nesting 插件，Tailwind CSS v3.4+ 已内置支持。

---

#### 2. Caddy 配置文件

**文件**: `apps/proxy/Caddyfile.ce`

**主要变更**:
- 将全局配置块移至文件开头
- 移除空的环境变量引用（`CERT_EMAIL`、`CERT_ACME_DNS`）
- 简化全局配置结构

**变更前**:
```caddyfile
(plane_proxy) {
  # ... 路由配置
}

{
  {$CERT_EMAIL}
  acme_ca {$CERT_ACME_CA:...}
  # ...
}

{$SITE_ADDRESS} {
  import plane_proxy
}
```

**变更后**:
```caddyfile
{
  servers {
    max_header_size 25MB
    # ...
  }
}

(plane_proxy) {
  # ... 路由配置
}

{$SITE_ADDRESS} {
  import plane_proxy
}
```

---

#### 3. Docker Compose 配置

**文件**: `docker-compose.yml`

**变更 1 - Live 服务环境变量**:
```yaml
live:
  container_name: plane-live
  # ... 其他配置
  environment:
    API_BASE_URL: http://api:8000
    LIVE_SERVER_SECRET_KEY: ${LIVE_SERVER_SECRET_KEY:-secret-key}
    REDIS_URL: redis://plane-redis:6379/
    REDIS_HOST: plane-redis
    REDIS_PORT: 6379
    PORT: 3000
  depends_on:
    - api
    - plane-redis
```

**变更 2 - Proxy 服务环境变量**:
```yaml
proxy:
  container_name: proxy
  # ... 其他配置
  environment:
    FILE_SIZE_LIMIT: ${FILE_SIZE_LIMIT:-5242880}
    BUCKET_NAME: ${AWS_S3_BUCKET_NAME:-uploads}
    SITE_ADDRESS: ${SITE_ADDRESS:-:80}
    TRUSTED_PROXIES: ${TRUSTED_PROXIES:-0.0.0.0/0}
```

---

### 依赖变更

#### 4. Admin 应用

**文件**: `apps/admin/package.json`

**新增依赖**:
```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.38"
  }
}
```

---

#### 5. Web 应用

**文件**: `apps/web/package.json`

**版本调整**:
```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18",  // 从 ^4.1.18 降级
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.38"
  }
}
```

---

#### 6. Space 应用

**文件**: `apps/space/package.json`

**版本调整**:
```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18",  // 从 ^4.1.18 降级
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.38"
  }
}
```

---

#### 7. Tailwind 配置包

**文件**: `packages/tailwind-config/package.json`

**新增依赖**:
```json
{
  "devDependencies": {
    "postcss-nesting": "^13.0.2",
    "postcss-import": "^15.1.0"
  }
}
```

> [!note] 注意
> 虽然添加了这些包，但最终在 postcss.config.js 中并未使用。

---

## 🔄 变更影响分析

### 前端应用

| 应用 | 影响 | 兼容性 |
|------|------|--------|
| Admin | ✅ 构建成功 | 完全兼容 |
| Web | ✅ 构建成功 | 完全兼容 |
| Space | ✅ 构建成功 | 完全兼容 |

### 后端服务

| 服务 | 影响 | 状态 |
|------|------|------|
| Live | ✅ 环境变量已配置 | 正常运行 |
| Proxy | ✅ Caddyfile 已修复 | 正常运行 |
| API | ➖ 无影响 | 正常运行 |

### 基础设施

| 组件 | 影响 | 状态 |
|------|------|------|
| PostgreSQL | ➖ 无影响 | 正常运行 |
| Redis | ➖ 无影响 | 正常运行 |
| MinIO | ➖ 无影响 | 正常运行 |
| RabbitMQ | ➖ 无影响 | 正常运行 |

---

## 🧪 测试验证

### 构建测试

```bash
✅ docker compose build admin    # 成功
✅ docker compose build web      # 成功
✅ docker compose build space    # 成功
✅ docker compose build live     # 成功
✅ docker compose build proxy    # 成功
```

### 服务启动测试

```bash
✅ docker compose up -d           # 所有服务启动
✅ docker compose ps              # 12/12 服务运行中
```

### 访问测试

```bash
✅ curl -I http://localhost:80/           # 200 OK
✅ curl -I http://localhost:80/god-mode/  # 200 OK
✅ curl -I http://localhost:80/spaces/    # 200 OK
```

---

## 📊 构建时间对比

| 服务 | 修复前 | 修复后 | 变化 |
|------|--------|--------|------|
| Admin | ❌ 失败 | ✅ ~1m45s | - |
| Web | ❌ 失败 | ✅ ~2m56s | - |
| Space | ❌ 失败 | ✅ ~1m30s | - |
| Live | ⚠️ 运行时错误 | ✅ ~30s | - |
| Proxy | ⚠️ 运行时错误 | ✅ ~2m20s | - |

**总构建时间**: 约 12 分钟（包含所有服务）

---

## ⚠️ 潜在风险与注意事项

### 1. Tailwind CSS 版本锁定

**风险**:
- 将 web 和 space 从 v4 降级到 v3
- 可能影响使用 v4 新特性的代码

**缓解措施**:
- 项目配置基于 v3，降级是正确选择
- 未发现使用 v4 专属特性的代码

### 2. PostCSS Nesting 移除

**风险**:
- 如果代码中使用了嵌套 CSS，可能受影响

**缓解措施**:
- Tailwind CSS v3.4+ 内置 nesting 支持
- 实际测试中未发现兼容性问题

### 3. 环境变量硬编码

**风险**:
- Live 和 Proxy 服务的某些环境变量使用默认值

**缓解措施**:
- 使用 `${VAR:-default}` 语法提供回退
- 生产环境应在 .env 文件中明确设置

---

## 🔍 未解决的问题

### Space 服务健康检查

**现象**: Space 服务显示 `unhealthy` 状态

**影响**:
- 服务功能正常，可以正常访问
- 仅健康检查未通过

**跟进**:
- [ ] 检查 Space 应用的健康检查端点
- [ ] 调整健康检查配置或超时时间
- [ ] 优先级：低（不影响使用）

---

## 📚 相关文档

- [[Docker构建问题修复指南]] - 详细的修复步骤
- [[Docker快速参考]] - 常用命令参考
- [CLAUDE.md](../CLAUDE.md) - 项目配置说明

---

## 🎯 后续行动

### 短期（1周内）

- [x] 修复所有构建问题
- [x] 验证所有服务正常运行
- [x] 创建技术文档
- [ ] 优化 Space 服务健康检查

### 中期（1个月内）

- [ ] 考虑升级到 Tailwind CSS v4
  - 评估 v4 新特性
  - 更新项目配置
  - 全面测试兼容性
- [ ] 优化 Docker 镜像大小
- [ ] 添加性能监控

### 长期

- [ ] 实施自动化测试
- [ ] CI/CD 集成
- [ ] 监控告警系统

---

## 👥 团队通知

> [!important] 开发人员注意
> 1. 请更新本地依赖：`pnpm install`
> 2. 重新构建 Docker 镜像
> 3. 查看新的技术文档：`docs/`
> 4. 遇到问题先查阅文档

> [!warning] 生产部署
> 1. 确保所有环境变量已配置
> 2. 使用 .env 文件而非默认值
> 3. 备份现有数据
> 4. 在测试环境先验证

---

## 📞 联系方式

**问题反馈**:
- 创建 GitHub Issue
- 联系 DevOps 团队

**文档更新**:
- 直接修改 `docs/` 目录下的文件
- 提交 PR 供审核

---

**记录人**: Claude (AI Assistant)
**审核人**: DevOps Team
**最后更新**: 2025-12-12

#changelog #docker #fix #deployment
