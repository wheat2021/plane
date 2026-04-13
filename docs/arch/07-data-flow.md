# 07 · 全栈数据流

> 本文通过两条典型场景，追踪从用户操作到数据持久化的完整链路。

---

## 场景一：创建 Issue

### 1. 用户点击"Create Issue"

```
[Web App - React Component]
  web/core/components/issues/issue-layouts/
    ↓ 调用 useProjectIssueActions()
    ↓ 调用 store.issues.createIssue(payload)
```

### 2. MobX Store 发起请求

```
[MobX Store - base-issues.store.ts]
  accumulateIssueUpdates()
    ↓ 乐观更新本地 observable（立即更新 UI）
    ↓ 调用 IssueService.create(workspaceSlug, projectId, payload)
```

### 3. Service 层发送 HTTP 请求

```
[@plane/services - IssueService]
  POST /api/v1/workspaces/{slug}/projects/{id}/issues/
    Header: X-Api-Key 或 Cookie (Session)
    Body: { name, state_id, assignees, priority, ... }
```

### 4. Nginx 路由

```
[Nginx Proxy - apps/proxy/]
  /api/* → api:8000
```

### 5. Django API 处理

```
[Django - api/plane/app/views/issue/base.py]
  IssueViewSet.create()
    ↓ BaseAPIView.__dispatch__()
    │  ├── 认证检查（SessionAuthentication / APIKeyAuthentication）
    │  ├── 权限检查（IsAuthenticated + ProjectMember）
    │  └── 读副本路由（写操作 → 主库）
    ↓ IssueSerializer.validate(data)
    │  ├── 验证 state_id 归属正确项目
    │  ├── 验证 assignees 是项目成员
    │  └── 处理 extra_properties（自定义字段）
    ↓ serializer.save()
    │  → Issue.objects.create(...)
    │  → PostgreSQL 主库写入
    ↓ 触发 Celery 后台任务:
       issue_activities_task.delay(type="issue.activity.created", ...)
       notification_task.delay(issue_id=..., ...)
```

### 6. 后台任务异步执行

```
[Celery Worker - bgtasks/]
  issue_activities_task():
    → 写入 IssueActivity 表（活动日志）
  notification_task():
    → 查询订阅者和提及用户
    → email_notification_task.delay(...)
    → 应用内通知
  webhook_task():
    → 推送到配置的 Webhook URL
```

### 7. 响应返回前端

```
API → 201 Created
  Body: IssueSerializer(issue).data

MobX Store:
  ├── 更新乐观更新的 Issue 数据
  └── 触发 observable 更新 → React re-render
```

---

## 场景二：编辑 Page 文档（实时协作）

### 1. 用户打开 Page

```
[Web App]
  web/core/components/pages/...
    ↓ 加载 @plane/editor（DocumentEditor）
    ↓ 建立 WebSocket 连接
```

### 2. WebSocket 握手

```
[Hocuspocus WebSocket]
  ws://live:3003/collaboration?token=xxx&documentId=page_xxx
    ↓
live/src/server.ts → 认证扩展
  → 调用 api.service.ts
  → GET /api/v1/users/me/（验证 token）
```

### 3. 加载文档

```
[live/src/extensions/database.ts]
  onLoadDocument(context):
    → ProjectPageService.fetchDetails(workspaceSlug, projectId, pageId)
    → GET /api/v1/.../pages/{id}/
    → 返回 description_binary（Y.js CRDT 格式）
```

### 4. 实时编辑同步

```
用户 A 输入文字
    ↓ TipTap 生成 Y.js 操作（CRDT update）
    ↓ WebSocket → live server
    ↓ Hocuspocus 广播给同文档的其他连接
    ↓ 用户 B 的编辑器应用 CRDT update
    ↓ 自动合并冲突（OT 算法）

多实例同步:
    ↓ Redis Pub/Sub（RedisManager）
    ↓ 另一个 live 实例上的用户也能实时看到
```

### 5. 文档持久化

```
[live/src/extensions/database.ts]
  onStoreDocument(context):
    → 将 Y.js 文档序列化为 HTML
    → ProjectPageService.updatePage(...)
    → PATCH /api/v1/.../pages/{id}/
    → Django 保存 description_html 到 PostgreSQL
```

### 6. 标题同步

```
[live/src/extensions/title-sync.ts + debounce.ts]
  标题变更 → 防抖 1s
    → PATCH /api/v1/.../pages/{id}/ { name: "新标题" }
    → Django 保存
```

---

## 读副本路由

对于读操作（Issue 列表、详情页加载），请求自动路由到**读副本数据库**：

```python
class IssueViewSet(BaseAPIView):
    use_read_replica = True  # GET 请求走读副本

# middleware/db_routing.py
if request.method in ('GET', 'HEAD', 'OPTIONS') and view.use_read_replica:
    using = settings.READ_REPLICA_DB
else:
    using = 'default'  # 主库
```

---

## 缓存层

```
Django API
    ↓ 装饰器
@cache_response(60 * 60)  # 1小时
def list_issues(self, request):
    ...

缓存 key = f"user:{user_id}:workspace:{slug}:issues:{params_hash}"

写操作后主动失效:
invalidate_cache_directly(cache_key)
```

Redis 缓存减少了 PostgreSQL 查询压力，特别是在 Issue 列表、分析图表等场景。

---

## 文件上传流程

```
用户在编辑器插入图片
    ↓
@plane/editor 调用 onUpload(file)
    ↓
FileService.uploadProjectAsset(file)
    ↓
POST /api/v1/assets/ (multipart/form-data)
    ↓
Django → S3Storage.save(file)
    ↓
MinIO / AWS S3 存储
    ↓
返回资产 URL（presigned URL 或 CDN URL）
    ↓
编辑器插入 <img src="https://...">
```

后台任务 `copy_s3_object.py` 处理资产复制（如复制 Issue 到另一项目时）。

---

## 总结：技术栈与链路映射

| 层次       | 技术                   | 关键节点                  |
| ---------- | ---------------------- | ------------------------- |
| 路由层     | React Router           | app/routes/               |
| 状态层     | MobX                   | RootStore → 各 Store      |
| 服务层     | Axios                  | @plane/services           |
| API 网关   | Nginx                  | apps/proxy/               |
| Web 框架   | Django REST Framework  | BaseAPIView → BaseViewSet |
| 序列化     | DRF Serializers        | BaseSerializer 体系       |
| 认证       | Session + API Key      | authentication/           |
| 数据库     | PostgreSQL（主+副本）  | BaseModel → Django ORM    |
| 缓存       | Redis                  | cache_response 装饰器     |
| 文件       | MinIO/S3               | S3Storage                 |
| 异步       | Celery + RabbitMQ      | bgtasks/                  |
| 实时       | WebSocket + Hocuspocus | live/src/                 |
| 多实例同步 | Redis Pub/Sub          | RedisManager              |
