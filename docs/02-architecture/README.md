# 架构设计文档

本目录包含 Plane 项目的架构设计文档，涵盖系统设计、技术选型、架构决策等内容。

## 📋 文档列表

### 核心文档

- **[架构概览](architecture-overview.md)** - Plane 项目的整体架构设计
  - Monorepo 结构和组织方式
  - 前端和后端技术栈
  - 核心组件和数据流
  - 技术选型理由
  - 性能和安全设计
  - 架构决策记录 (ADR)

- **[核心组件架构](19_repo_doc_ref/plane/02-architecture/components.md)** - 核心组件详解
  - 系统架构概览
  - 前端应用组件 (Web, Admin, Space, Live)
  - 后端服务组件 (API, Worker, Beat, Migrator)
  - 基础设施组件 (PostgreSQL, Redis, RabbitMQ, MinIO, Proxy)
  - 组件依赖关系和初始化流程
  - 开发模式 vs 生产部署模式对比

- **[核心数据模型](data-models.md)** - 数据结构与实体关系
  - 核心实体关系图 (ER Diagram)
  - Django 数据模型详解
  - 项目内部关系和全局外部关系
  - 数据模型最佳实践

- **[Proxy 组件](proxy-component.md)** - 反向代理层技术文档
  - Caddy 2 配置和路由规则
  - 统一入口和请求路由
  - 文件上传处理
  - 安全增强和 HTTPS 配置

## 🎯 阅读指南

### 快速了解架构

如果你是新加入的开发者，建议按以下顺序阅读：

1. **[架构概览](architecture-overview.md)** - 从整体了解系统架构
2. **[部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md)** - 搭建开发环境
3. 开始贡献代码

### 深入理解技术栈

如果你想深入了解技术细节：

- [架构概览 - Monorepo 结构](architecture-overview.md#monorepo-结构)
- [架构概览 - 核心组件](architecture-overview.md#核心组件)
- [架构概览 - 数据流](architecture-overview.md#数据流)
- [架构概览 - 技术选型](architecture-overview.md#技术选型)

### 了解架构决策

如果你想了解为什么做出某些技术选择：

- [架构概览 - 决策记录](architecture-overview.md#决策记录)
  - 从 Next.js 迁移到 React Router 7
  - 采用 MobX 作为状态管理
  - Monorepo 架构选择

## 🏗️ 架构概览

### 系统分层

```
┌─────────────────────────────────────────┐
│  客户端应用层 (Web, Admin, Space)       │
├─────────────────────────────────────────┤
│  共享包层 (@plane/*)                    │
│  - propel (UI 组件)                     │
│  - shared-state (MobX Stores)           │
│  - services (API 客户端)                │
│  - types, hooks, utils...               │
├─────────────────────────────────────────┤
│  后端服务层                              │
│  - Django REST API                      │
│  - Live WebSocket 服务                  │
│  - Proxy 服务                           │
├─────────────────────────────────────────┤
│  数据层                                  │
│  - PostgreSQL                           │
│  - Redis                                │
└─────────────────────────────────────────┘
```

### 核心技术栈

| 层级 | 技术 |
|-----|------|
| **前端** | React 18.3 + React Router 7 + MobX + Vite |
| **状态管理** | MobX 6.12 + SWR 2.2 |
| **后端** | Django 4.2 + DRF + Celery |
| **数据库** | PostgreSQL 14+ + Redis 6.2.7+ |
| **构建** | pnpm 10.21 + Turborepo |

## 📚 相关文档

- [部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md) - 如何部署 Plane
- [项目主文档](../../README.md) - 项目概述
- [CLAUDE.md](../../.claude/CLAUDE.md) - 项目结构说明

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建架构文档目录和架构概览 |
| 2025-12-30 | 整理文档结构，添加核心组件、数据模型和 Proxy 组件文档 |

---

**文档维护**: DevOps & Architecture Team
**最后更新**: 2025-12-30
