# 05 · Live Service 架构

> **路径**: `apps/live/`  
> **技术栈**: TypeScript · Node.js · Hocuspocus · Redis · WebSocket  
> **节点规模**: 145 nodes  
> **端口**: 3003

---

## 1. 定位与职责

Live Service 提供**实时协作**能力：

- Pages（文档）的多人同时编辑
- 基于 [Hocuspocus](https://tiptap.dev/hocuspocus) 协议（CRDT OT）
- 通过 Redis Pub/Sub 在多实例间同步状态

---

## 2. 目录结构

```
apps/live/
└── src/
    ├── server.ts              ← 服务入口（16 edges）
    ├── redis.ts               ← Redis 连接管理（14 edges）
    ├── services/
    │   ├── api.service.ts     ← API 调用基类（62 edges，最高！）
    │   ├── user.service.ts    ← 用户信息（29 edges）
    │   └── page/
    │       └── project-page.service.ts ← 页面文档 CRUD（20 edges）
    ├── extensions/            ← Hocuspocus 扩展
    │   ├── database.ts        ← 文档持久化到数据库（12 edges）
    │   ├── title-sync.ts      ← 标题同步（11 edges）
    │   └── title-update/
    │       └── debounce.ts    ← 标题更新防抖（12 edges）
    └── lib/
        └── errors.ts          ← 错误处理（13 edges）
```

---

## 3. 核心架构：Hocuspocus

```
WebSocket 连接
    ↓
Hocuspocus Server（server.ts）
    ↓ Extensions
├── 认证扩展      ← 验证用户 Token（调用 api.service.ts）
├── 数据库扩展    ← 加载/保存文档（database.ts）
│   ↓ 读写
│   ProjectPageService → REST API → Django → PostgreSQL
├── 标题同步扩展  ← 文档标题变更同步（title-sync.ts）
└── Redis 扩展    ← 多实例间文档同步（redis.ts）
```

---

## 4. 关键组件

### api.service.ts（62 edges — 最高）

```typescript
class APIService {
  // 所有对 Django REST API 的调用都通过此基类
  // 封装 axios，注入认证 header
  // 被 UserService、ProjectPageService 继承
}
```

### RedisManager（14 edges）

```typescript
class RedisManager {
  // Hocuspocus Redis 适配器
  // 在多个 live 实例之间同步 CRDT 文档状态
  // 使用 CRDT 算法，冲突自动合并
}
```

### DebounceManager（12 edges）

```typescript
class DebounceManager {
  // 标题变更防抖：用户停止输入 1s 后才同步
  // 避免频繁 API 调用
}
```

---

## 5. 文档协作流程

```
用户 A 打开 Page 文档
    ↓
WebSocket 连接到 live:3003
    ↓ (认证扩展验证 Token)
Hocuspocus 加载文档
    ↓ (数据库扩展)
调用 project-page.service.ts
    ↓ REST API
Django API → PostgreSQL 读取 description_html
    ↓
文档加载完成，用户开始编辑
    ↓ (CRDT 实时同步)
其他在线用户实时看到变更
    ↓ (Redis 跨实例同步)
其他 live 实例上的用户也能看到
    ↓ (标题同步扩展 + 防抖)
标题变更 → Django API → 更新 Page.name
```

---

## 6. 与其他服务的关系

```
live ↔ web:   106 edges（web 前端通过 WebSocket 连接 live）
live ↔ api:    32 edges（live 调用 Django REST API）
live ↔ space:  21 edges（space 也支持实时协作）
live ↔ admin:   9 edges（少量，仅类型共享）
```

---

## 7. 部署注意

- Live Service 通过 Nginx proxy 对外暴露 WebSocket 端点
- 多实例部署时必须共享同一个 Redis 实例
- 认证凭据通过 WebSocket 握手传递，live 服务验证 Plane Session Token

---

## 阅读建议

1. 从 `live/src/server.ts` 开始 → 理解 Hocuspocus 服务配置
2. 读 `live/src/services/api.service.ts` → 理解服务间通信基础
3. 读 `live/src/extensions/database.ts` → 理解文档持久化
4. 读 `live/src/redis.ts` → 理解多实例协调
