# 00 · Plane 架构总览

> 本系列文档基于知识图谱分析（7852 节点 · 16052 边 · 422 社区）自动提取，
> 辅以代码阅读生成，指引读者从整体到局部、由浅入深地理解项目各服务架构。

---

## 文档导航

| 编号 | 文档                                        | 内容                                 |
| ---- | ------------------------------------------- | ------------------------------------ |
| 00   | 本文                                        | 整体架构 & 服务关系图                |
| 01   | [api-service.md](01-api-service.md)         | Django REST 后端 — 核心 God Nodes    |
| 02   | [web-app.md](02-web-app.md)                 | 主前端 Web App — MobX + React Router |
| 03   | [space-app.md](03-space-app.md)             | 公开共享 Space App (SSR)             |
| 04   | [admin-app.md](04-admin-app.md)             | 管理后台 Admin Panel                 |
| 05   | [live-service.md](05-live-service.md)       | 实时协作 Live Service                |
| 06   | [shared-packages.md](06-shared-packages.md) | 共享包 (ui/types/services/hooks/…)   |
| 07   | [data-flow.md](07-data-flow.md)             | 全栈数据流 — 请求链路与状态同步      |

---

## 服务全景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Browser / Client                                                           │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐              │
│  │  web :3000   │  │ space :3002  │  │    admin :3001        │              │
│  │ Main Dashboard│  │ Public Pages │  │  Instance Admin       │              │
│  │ React Router │  │ React+SSR    │  │  React Router         │              │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘              │
└─────────┼─────────────────┼──────────────────────┼──────────────────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────┐
│             proxy (Nginx :80)                   │
│  路由规则: /api/* → api:8000                    │
│           /space/ → space:3002                  │
│           default → web:3000                    │
└────────────────────────┬────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   api (Django :8000)        │
          │   BaseAPIView / BaseViewSet  │
          │   120+ DB Models (PostgreSQL)│
          │   Celery Worker (bgtasks)    │
          │   S3Storage (MinIO/S3)       │
          └──────┬──────────────────────┘
                 │ REST
          ┌──────▼───────┐
          │ live (Node)  │  ← WebSocket 协作 (Hocuspocus)
          │  :3003       │
          └──────────────┘

基础设施: PostgreSQL · Redis · RabbitMQ · MinIO
```

---

## God Nodes — 系统核心抽象

图谱中连接数最高的节点即为系统"上帝节点"，代表跨模块通用抽象：

| 排名 | 节点                    | 边数 | 路径                                    | 职责                                                 |
| ---- | ----------------------- | ---- | --------------------------------------- | ---------------------------------------------------- |
| 1    | `BaseAPIView`           | 381  | `api/plane/space/views/base.py`         | 所有 API 视图的基类，注入认证/权限/分页/读副本路由   |
| 2    | `BaseSerializer`        | 259  | `api/plane/space/serializer/base.py`    | 所有序列化器基类，提供动态字段和额外属性支持         |
| 3    | `S3Storage`             | 127  | `api/plane/settings/storage.py`         | 文件存储统一入口（MinIO/S3），附件/资产/导出均经此   |
| 4    | `UserLiteSerializer`    | 113  | `api/plane/space/serializer/user.py`    | 用户精简序列化器，被所有含用户字段的序列化器引用     |
| 5    | `BaseModel`             | 91   | `api/plane/db/models/base.py`           | 所有 DB 模型基类，提供 UUID 主键、软删除、审计时间戳 |
| 6    | `DynamicBaseSerializer` | 87   | `api/plane/space/serializer/base.py`    | 动态字段序列化器，支持运行时字段裁剪                 |
| 7    | `BaseViewSet`           | 83   | `api/plane/space/views/base.py`         | ViewSet 基类，扩展 BaseAPIView + CRUD 路由           |
| 8    | `ProjectBaseModel`      | 82   | `api/plane/db/models/project.py`        | 项目范围内模型基类，含 workspace/project 外键        |
| 9    | `StateLiteSerializer`   | 74   | `api/plane/space/serializer/state.py`   | Issue 状态精简序列化器                               |
| 10   | `ProjectLiteSerializer` | 63   | `api/plane/space/serializer/project.py` | 项目精简序列化器                                     |

---

## 服务规模

| 服务  | 节点数 | 主要子模块                                                                |
| ----- | ------ | ------------------------------------------------------------------------- |
| api   | 3901   | db · app · utils · tests · api · bgtasks · authentication · space         |
| web   | 3338   | core/components · core/services · core/store · ce/components · core/hooks |
| space | 300    | core/components · ce/store · app/compat                                   |
| live  | 145    | services · extensions                                                     |
| admin | 88     | core/hooks · core/providers · app/dashboard                               |

---

## 跨服务依赖热图

```
           api   web   space  admin  live
api         —    535    301    38    32
web        535    —    1952   891   106
space      301  1952     —    191    21
admin       38   891    191    —      9
live        32   106     21    9      —
```

**结论**：`space ↔ web` 共享最多（1952 边），因为 space 的布局/组件与 web 核心库深度复用。
`api ↔ web` (535) 次之，主要是 service 层 API 调用类型共享。

---

## Suggested Questions 解答

**Q1: BaseAPIView 为何连接如此多社区？**
BaseAPIView 是所有 HTTP 端点的唯一基类（Django Migrations 中的每个 ViewSet 都继承它），同时它依赖 BaseSerializer（序列化）、S3Storage（资产上传）、DB Models（数据访问）、Celery（异步任务）。它的高中介中心性（betweenness=0.061）说明它是后端各层的"胶水"节点。

**Q2: BaseSerializer 的 253 条推断边是否可信？**
可信度较高。BaseSerializer 是所有 API/Space/License 序列化器的直接父类，每个 Meta 内部类都会通过 Python MRO 推断继承关系。实际上 Django REST Framework 的 Meta 模式确实产生大量隐式关系。

**Q3: React Components 社区凝聚度为 0.0 说明什么？**
`web/core/components` 有 1626 个节点，UI 组件之间通常是单向依赖（父引用子），不形成密集双向网络，因此凝聚度极低。这是正常的前端组件树特征，并非问题。

**Q4: 730 个弱连接节点的含义？**
主要来自测试文件（`tests/` 下的 fixture 和 smoke test）和孤立的类型声明文件，它们只被外部引用但自身不对外暴露，属于正常的叶节点。

---

## 阅读路线建议

1. **后端入门** → `01-api-service.md`：从 BaseModel → BaseAPIView → 业务 ViewSet 的层次
2. **前端入门** → `02-web-app.md`：从 store-context → MobX Store → React Component 的数据流
3. **了解公开页** → `03-space-app.md`：SSR + 嵌入式 Issue 展示
4. **了解运维管理** → `04-admin-app.md`：实例配置与认证设置
5. **了解实时协作** → `05-live-service.md`：WebSocket + Redis + Hocuspocus
6. **共享库深度** → `06-shared-packages.md`：types/ui/services/hooks 的分工
7. **全链路追踪** → `07-data-flow.md`：一个 Issue 创建请求的完整生命周期
