# 01 · API Service 架构

> **路径**: `apps/api/`  
> **技术栈**: Python · Django · Django REST Framework · Celery · PostgreSQL · Redis  
> **节点规模**: 3901 nodes（占整图 ~50%）

---

## 1. 层次结构（由浅入深）

```
apps/api/plane/
├── settings/          # 配置层：数据库、存储、Celery、中间件
├── db/                # 数据层：模型、迁移
├── authentication/    # 认证层：Session / OAuth / API Key / JWT
├── space/             # 核心层：BaseAPIView、BaseSerializer、Views、Serializers
├── api/               # 外部API层：/api/ 路由下的端点
├── app/               # 内部应用层：/app/ 路由下的端点（需登录）
├── license/           # 授权层：实例许可证和管理员功能
├── analytics/         # 分析层：高级分析聚合
├── bgtasks/           # 异步层：Celery 后台任务
├── middleware/        # 中间件层：读副本路由、请求限速
└── utils/             # 工具层：常量、UUID、日期、分页
```

---

## 2. 入口点（urls.py）

```
/api/v1/           → api/plane/urls.py (外部 API，API Token 认证)
/                  → app/ 路由（Session 认证，需登录）
/space/            → space/ 路由（公开/共享端点）
/god-mode/         → license/admin/ 路由（实例管理员）
```

---

## 3. God Node 深解：BaseAPIView

**位置**: `api/plane/space/views/base.py`  
**连接**: 381 边，betweenness=0.061（最高中介中心性）

```python
# 继承链
class BaseAPIView(TimezoneMixin, generics.GenericAPIView):
    # 注入功能：
    # - authentication_classes = [SessionAuthentication, APIKeyAuthentication]
    # - permission_classes = [IsAuthenticated]
    # - filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    # - 读副本路由（use_read_replica 属性）
    # - 统一异常处理
    # - 分页（cursor-based）
```

**为何连接所有社区？**

```
BaseAPIView
    ├── 被继承 → 所有 API/App/Space 视图（381个端点）
    ├── 使用 → BaseSerializer（序列化响应）
    ├── 使用 → S3Storage（文件上传端点）
    ├── 依赖 → authentication/（认证体系）
    ├── 依赖 → middleware/（读副本数据库路由）
    └── 引用 → db/models/（每个视图都查询数据库）
```

---

## 4. God Node 深解：BaseSerializer

**位置**: `api/plane/space/serializer/base.py`  
**连接**: 259 边

```python
class BaseSerializer(serializers.ModelSerializer):
    # 功能：
    # - 自动处理 extra_properties（额外属性字段）
    # - 支持动态字段裁剪（DynamicBaseSerializer 子类）
    # - 集成 UserLiteSerializer、WorkspaceLiteSerializer、ProjectLiteSerializer
```

**序列化器继承树（关键节点）**:

```
BaseSerializer
├── DynamicBaseSerializer      ← 支持运行时字段选择
├── IssueSerializer            ← Issue 完整序列化
├── ProjectSerializer          ← 项目序列化
│   └── ProjectLiteSerializer  ← 轻量引用（63 edges）
├── UserLiteSerializer         ← 用户轻量引用（113 edges）
├── StateLiteSerializer        ← 状态轻量引用（74 edges）
└── WorkspaceLiteSerializer    ← 工作区轻量引用（61 edges）
```

---

## 5. God Node 深解：S3Storage

**位置**: `api/plane/settings/storage.py`  
**连接**: 127 边

```python
class S3Storage(S3Boto3Storage):
    # 统一处理：
    # - 用户头像、工作区Logo
    # - Issue 附件（FileAsset）
    # - 富文本编辑器资产（description_html 中的图片）
    # - 数据导出 ZIP 文件
    # - 分析图表导出
```

**关联路径**:

```
文件上传请求
  → FileAsset 模型（db/models/asset.py）
  → S3Storage（settings/storage.py）
  → MinIO / AWS S3
  → 后台任务 copy_s3_object.py（跨 workspace 复制资产）
```

---

## 6. 数据模型层（db/）

### 6.1 基础模型继承链

```
BaseModel (uuid pk, created_at, updated_at)
├── AuditModel              ← + created_by, updated_by
│   ├── WorkspaceBaseModel  ← + workspace FK
│   │   └── ProjectBaseModel ← + project FK (82 edges)
│   └── ...
└── TimeAuditModel          ← 仅时间戳，无审计用户
```

### 6.2 核心业务模型（按连接数排序）

| 模型                 | 文件                       | 说明                                                  |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `BaseModel`          | `models/base.py`           | 所有模型基类                                          |
| `ProjectBaseModel`   | `models/project.py`        | 项目域模型基类                                        |
| `WorkspaceBaseModel` | `models/workspace.py`      | 工作区域模型基类                                      |
| `Issue`              | `models/issue.py`          | 核心工作项模型                                        |
| `IssueComment`       | `models/issue.py`          | 工作项评论                                            |
| `Description`        | `models/description.py`    | 富文本描述版本化                                      |
| `StateGroup`         | `models/state.py`          | Issue 状态（Backlog/Todo/In Progress/Done/Cancelled） |
| `APIToken`           | `models/api.py`            | API Token 认证凭据                                    |
| `FileAsset`          | `models/asset.py`          | 文件附件（关联 S3）                                   |
| `IssueType`          | `models/issue_type.py`     | 工作项类型（自定义类型功能）                          |
| `ExtraProperty`      | `models/extra_property.py` | 额外属性（工作项自定义字段）                          |

---

## 7. 认证体系（authentication/）

```
认证适配器（Adapter Pattern）:
├── Adapter（base.py）          ← 抽象基类（245 edges）
│   ├── EmailProvider           ← 邮箱/密码登录
│   ├── MagicLinkProvider       ← 魔法链接（无密码）
│   └── OauthAdapter            ← OAuth 基类
│       ├── GitHubOAuthProvider ← GitHub OAuth
│       ├── GoogleOAuthProvider ← Google OAuth
│       └── GiteaOAuthProvider  ← Gitea OAuth
│
认证中间件:
├── SessionAuthentication       ← 浏览器会话
├── APIKeyAuthentication        ← API Token（X-Api-Key 头部）
└── BaseSessionAuthentication   ← 会话基类

限流:
├── EmailVerificationThrottle   ← 邮箱验证频率限制
└── AssetRateThrottle           ← 文件上传频率限制
```

---

## 8. 读副本路由中间件（middleware/）

Plane 支持 PostgreSQL 读副本，通过中间件智能路由：

```python
# 路由逻辑
if request.method in ('GET', 'HEAD', 'OPTIONS'):
    if view.use_read_replica:  # BaseAPIView 的属性
        → 读副本数据库（只读操作）
else:
    → 主数据库（写操作）
```

社区 16（DB Routing Middleware）的 67 个节点专门处理此逻辑。

---

## 9. 后台任务（bgtasks/ · Celery）

| 任务文件                     | 节点数 | 功能                         |
| ---------------------------- | ------ | ---------------------------- |
| `issue_activities_task.py`   | 42     | Issue 活动日志记录（最重要） |
| `cleanup_task.py`            | 20     | 数据清理（软删除物理回收）   |
| `notification_task.py`       | 9+10   | 通知推送（邮件/应用内）      |
| `webhook_task.py`            | 10     | Webhook 事件推送             |
| `analytic_plot_export.py`    | 13     | 分析图表 CSV 导出            |
| `issue_version_sync.py`      | 9      | Issue 描述版本同步           |
| `copy_s3_object.py`          | 9      | S3 跨空间资产复制            |
| `workspace_seed_task.py`     | 14     | 工作区初始化数据填充         |
| `email_notification_task.py` | 10     | 异步邮件发送                 |
| `work_item_link_task.py`     | 7      | 工作项链接处理               |

---

## 10. 高级分析（analytics/）

社区 45（AdvanceAnalytics）和社区 46：

```
AdvanceAnalyticsBaseView
├── AdvanceAnalyticsEndpoint    ← 聚合统计
├── AdvanceAnalyticsChartEndpoint ← 图表数据
└── AdvanceAnalyticsStatsEndpoint ← KPI 统计

关键函数:
├── build_analytics_chart()     ← 构建图表数据
├── get_extra_property_field()  ← 支持自定义属性轴
├── issue_queryset_grouper()    ← Issue 分组聚合
└── ep_annotation_name()        ← 额外属性 Django 注解名
```

---

## 11. 缓存策略（utils/cache.py）

```python
@cache_response(60 * 60)  # 1小时缓存
def list(self, request):   # 装饰器自动生成 per-user cache key
    ...

invalidate_cache_directly(key)  # 写操作后主动失效
```

---

## 阅读建议

1. 先读 `api/plane/db/models/base.py` → 理解 BaseModel
2. 读 `api/plane/space/views/base.py` → 理解 BaseAPIView/BaseViewSet
3. 读 `api/plane/space/serializer/base.py` → 理解 BaseSerializer
4. 读 `api/plane/authentication/adapter/base.py` → 理解认证适配器
5. 读 `api/plane/middleware/` → 理解读副本路由
6. 读 `api/plane/bgtasks/issue_activities_task.py` → 理解事件溯源
