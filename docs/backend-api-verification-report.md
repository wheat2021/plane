# Work Item Types 后端 API 验证报告

**验证日期：** 2025-12-12
**项目：** Plane 社区版
**目标：** 验证工作项类型功能的后端 API 实现情况

---

## 验证摘要 📊

| 项目     | 状态          | 说明                                         |
| -------- | ------------- | -------------------------------------------- |
| 数据模型 | ✅ **已实现** | `IssueType` 和 `ProjectIssueType` 模型已存在 |
| API 视图 | ❌ **未实现** | 缺少工作项类型管理的 ViewSet/Endpoint        |
| 序列化器 | ❌ **未实现** | 缺少专门的序列化器                           |
| URL 路由 | ❌ **未实现** | 没有工作项类型管理的路由                     |
| 数据迁移 | ⚠️ **需确认** | 模型存在，但需确认是否已迁移                 |

**结论：** 🔴 **后端 API 大部分未实现，需要从零开发**

---

## 详细验证结果

### 1. 数据模型 ✅

#### 1.1 IssueType 模型

**文件位置：** `/opt/code/plane/apps/api/plane/db/models/issue_type.py`

**模型定义：**

```python
class IssueType(BaseModel):
    workspace = models.ForeignKey("db.Workspace", related_name="issue_types", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    is_epic = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    level = models.FloatField(default=0)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
```

**字段说明：**

- ✅ `workspace` - 工作区外键
- ✅ `name` - 类型名称
- ✅ `description` - 类型描述
- ✅ `logo_props` - Logo 属性（JSON 字段）
- ✅ `is_epic` - 是否为 Epic 类型
- ✅ `is_default` - 是否为默认类型
- ✅ `is_active` - 是否激活
- ✅ `level` - 层级
- ✅ `external_source` & `external_id` - 外部集成字段

**数据库表名：** `issue_types`

#### 1.2 ProjectIssueType 模型

**文件位置：** 同上

**模型定义：**

```python
class ProjectIssueType(ProjectBaseModel):
    issue_type = models.ForeignKey("db.IssueType", related_name="project_issue_types", on_delete=models.CASCADE)
    level = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ["project", "issue_type", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="project_issue_type_unique_project_issue_type_when_deleted_at_null",
            )
        ]
```

**字段说明：**

- ✅ `project` - 项目外键（继承自 ProjectBaseModel）
- ✅ `issue_type` - 工作项类型外键
- ✅ `level` - 项目内的层级
- ✅ `is_default` - 项目内是否为默认类型

**数据库表名：** `project_issue_types`

**约束：**

- 每个项目中的工作项类型唯一（忽略软删除）
- 支持软删除

#### 1.3 Issue 模型集成

**文件位置：** `/opt/code/plane/apps/api/plane/db/models/issue.py:166`

**类型字段：**

```python
type = models.ForeignKey(
    "db.IssueType",
    on_delete=models.SET_NULL,
    related_name="issue_type",
    # ... 其他配置
)
```

✅ Issue 模型已经集成了 type 字段，可以关联工作项类型

#### 1.4 模型导出

**文件位置：** `/opt/code/plane/apps/api/plane/db/models/__init__.py`

```python
from .issue_type import IssueType
```

⚠️ **问题：** 只导出了 `IssueType`，没有导出 `ProjectIssueType`
**影响：** API 视图可能需要手动导入 `ProjectIssueType`

---

### 2. API 视图 ❌

#### 2.1 搜索结果

**搜索路径：** `/opt/code/plane/apps/api/plane/api/views/`

**搜索模式：** `*issue*type*.py`, `*work*item*type*.py`

**结果：** ❌ 未找到任何专门的工作项类型视图文件

#### 2.2 现有视图文件

```
/opt/code/plane/apps/api/plane/api/views/
├── asset.py
├── base.py
├── cycle.py
├── intake.py
├── invite.py
├── issue.py        # 包含 Issue 相关视图，但无类型管理
├── member.py
├── module.py
├── project.py      # 包含 Project 视图，但无类型管理
├── state.py
├── sticky.py
└── user.py
```

#### 2.3 Issue 序列化器中的使用

**文件位置：** `/opt/code/plane/apps/api/plane/api/serializers/issue.py:62`

```python
type_id = serializers.PrimaryKeyRelatedField(
    source="type",
    queryset=IssueType.objects.all(),
    required=False,
    allow_null=True
)
```

**创建 Issue 时的逻辑：**（issue.py:154-161）

```python
issue_type = validated_data.pop("type", None)

if not issue_type:
    # Get default issue type
    issue_type = IssueType.objects.filter(
        project_issue_types__project_id=project_id,
        is_default=True
    ).first()

issue = Issue.objects.create(**validated_data, project_id=project_id, type=issue_type)
```

✅ **发现：** 创建 Issue 时会自动使用默认工作项类型，但**无法管理工作项类型本身**

---

### 3. 序列化器 ❌

#### 3.1 搜索结果

**搜索路径：** `/opt/code/plane/apps/api/plane/api/serializers/`

**结果：** ❌ 未找到专门的工作项类型序列化器

#### 3.2 需要创建的序列化器

根据商业版文档和功能需求，需要创建：

1. **IssueTypeSerializer** - 工作项类型基础序列化器
2. **ProjectIssueTypeSerializer** - 项目工作项类型序列化器
3. **IssueTypeListSerializer** - 列表序列化器（如需要）
4. **IssueTypeCreateSerializer** - 创建序列化器（如需要）

---

### 4. URL 路由 ❌

#### 4.1 搜索结果

**搜索路径：** `/opt/code/plane/apps/api/plane/api/urls/`

**搜索模式：** `issue-type`, `work-item-type`

**结果：** ❌ 未找到任何工作项类型管理路由

#### 4.2 现有 URL 配置

**文件：** `/opt/code/plane/apps/api/plane/api/urls/__init__.py`

```python
urlpatterns = [
    *asset_patterns,
    *cycle_patterns,
    *intake_patterns,
    *label_patterns,
    *member_patterns,
    *module_patterns,
    *project_patterns,     # 项目路由
    *state_patterns,
    *user_patterns,
    *work_item_patterns,   # Work Items（即 Issues）
    *invite_patterns,
    *sticky_patterns,
]
```

#### 4.3 Work Item 路由分析

**文件：** `/opt/code/plane/apps/api/plane/api/urls/work_item.py`

这个文件包含的是 work-items（工作项本身）的 CRUD 路由，**不是**工作项类型的管理路由：

```python
# 工作项路由（已存在）
workspaces/<slug>/projects/<project_id>/work-items/              # 列表/创建
workspaces/<slug>/projects/<project_id>/work-items/<pk>/         # 详情/更新/删除
workspaces/<slug>/projects/<project_id>/work-items/<id>/comments/  # 评论
# ... 其他工作项相关路由
```

**缺失的路由：**（需要添加）

```python
# 工作项类型路由（不存在！）
workspaces/<slug>/projects/<project_id>/work-item-types/         # ❌ 需要创建
workspaces/<slug>/projects/<project_id>/work-item-types/<pk>/    # ❌ 需要创建
```

---

### 5. 数据迁移 ⚠️

#### 5.1 迁移文件搜索

**搜索命令：**

```bash
find /opt/code/plane/apps/api/plane/db/migrations -name "*.py" -exec grep -l "IssueType" {} \;
```

**找到的迁移文件：**

```
0074_deploy_board_and_project_issues.py
0070_apitoken_is_service_exporterhistory_filters_and_more.py
0073_alter_commentreaction_unique_together_and_more.py
0077_draftissue_cycle_user_timezone_project_user_timezone_and_more.py
0071_rename_issueproperty_issueuserproperty_and_more.py
```

✅ **发现：** 有多个迁移文件涉及 IssueType

#### 5.2 最新迁移

**最新的 5 个迁移：**

```
0112_auto_20251124_0603.py
0111_notification_notif_receiver_status_idx_and_more.py
0110_workspaceuserproperties_navigation_control_preference_and_more.py
0109_issuecomment_description_and_parent_id.py
```

⚠️ **需要确认：** 运行 `python manage.py showmigrations` 确认所有迁移已应用

---

## 与商业版文档对比 📝

### 商业版文档声称的 API 端点

根据 `/opt/code/plane-developer-docs/api-reference/issue-types/`：

```
GET    /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/
POST   /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/
PATCH  /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/{type_id}/
DELETE /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/{type_id}/
GET    /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/{type_id}/
```

### 实际情况

❌ **以上端点在社区版代码中均未找到实现**

**可能的原因：**

1. 这些 API 仅在商业版中实现
2. 文档是针对未来版本的
3. 功能正在开发中但尚未合并

---

## 需要实现的内容 🛠️

### 阶段一：后端 API 开发（新增）

#### 1.1 序列化器

**文件：** `apps/api/plane/api/serializers/issue_type.py`（新建）

需要创建：

- `IssueTypeSerializer` - 基础序列化器
- `ProjectIssueTypeSerializer` - 项目类型关联序列化器
- `IssueTypeDetailSerializer` - 详情序列化器（包含关联信息）

#### 1.2 视图

**文件：** `apps/api/plane/api/views/issue_type.py`（新建）

需要创建：

- `IssueTypeListCreateAPIEndpoint` - 列表和创建
- `IssueTypeDetailAPIEndpoint` - 获取、更新、删除单个类型
- `IssueTypeToggleAPIEndpoint` - 启用/禁用类型（可选）

#### 1.3 权限

需要定义：

- 谁可以创建工作项类型？（工作区管理员？项目管理员？）
- 谁可以编辑/删除类型？
- 删除类型时如何处理关联的 Issues？

#### 1.4 URL 路由

**文件：** `apps/api/plane/api/urls/issue_type.py`（新建）

```python
from django.urls import path
from plane.api.views import (
    IssueTypeListCreateAPIEndpoint,
    IssueTypeDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/",
        IssueTypeListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-type-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/<uuid:pk>/",
        IssueTypeDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-type-detail",
    ),
]
```

**修改：** `apps/api/plane/api/urls/__init__.py`

添加：

```python
from .issue_type import urlpatterns as issue_type_patterns

urlpatterns = [
    # ... 现有路由
    *issue_type_patterns,  # 新增
]
```

#### 1.5 数据初始化

**文件：** `apps/api/plane/db/migrations/XXXX_create_default_issue_types.py`（新建）

创建数据迁移，为所有现有项目创建默认的工作项类型：

```python
def create_default_types(apps, schema_editor):
    Project = apps.get_model('db', 'Project')
    IssueType = apps.get_model('db', 'IssueType')
    ProjectIssueType = apps.get_model('db', 'ProjectIssueType')

    for project in Project.objects.all():
        # 为每个项目创建默认的 Task 类型
        issue_type, created = IssueType.objects.get_or_create(
            workspace=project.workspace,
            name='Task',
            defaults={
                'description': 'Default work item type',
                'is_default': True,
                'is_active': True,
                'logo_props': {'icon': 'task', 'color': '#3b82f6'}
            }
        )

        # 关联到项目
        ProjectIssueType.objects.get_or_create(
            project=project,
            issue_type=issue_type,
            defaults={'is_default': True}
        )
```

#### 1.6 信号处理器（可选）

**文件：** `apps/api/plane/db/signals/issue_type.py`（新建）

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from plane.db.models import Project, IssueType, ProjectIssueType

@receiver(post_save, sender=Project)
def create_default_issue_type(sender, instance, created, **kwargs):
    """新建项目时自动创建默认工作项类型"""
    if created:
        issue_type, _ = IssueType.objects.get_or_create(
            workspace=instance.workspace,
            name='Task',
            defaults={
                'description': 'Default work item type',
                'is_default': True,
                'is_active': True,
                'logo_props': {'icon': 'task', 'color': '#3b82f6'}
            }
        )

        ProjectIssueType.objects.create(
            project=instance,
            issue_type=issue_type,
            is_default=True
        )
```

---

## 测试计划 ✅

### 手动测试（待 API 实现后）

#### 1. 创建工作项类型

```bash
curl -X POST http://localhost:8000/api/v1/workspaces/{slug}/projects/{id}/work-item-types/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bug",
    "description": "Bug fix work items",
    "logo_props": {"icon": "bug", "color": "#ef4444"},
    "is_active": true
  }'
```

#### 2. 列出工作项类型

```bash
curl http://localhost:8000/api/v1/workspaces/{slug}/projects/{id}/work-item-types/
```

#### 3. 更新工作项类型

```bash
curl -X PATCH http://localhost:8000/api/v1/workspaces/{slug}/projects/{id}/work-item-types/{type_id}/ \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

#### 4. 删除工作项类型

```bash
curl -X DELETE http://localhost:8000/api/v1/workspaces/{slug}/projects/{id}/work-item-types/{type_id}/
```

#### 5. 使用类型创建 Issue

```bash
curl -X POST http://localhost:8000/api/v1/workspaces/{slug}/projects/{id}/work-items/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fix login bug",
    "type_id": "{issue_type_id}"
  }'
```

---

## 推荐的实施顺序 📋

1. ✅ **验证数据模型**（已完成）
2. ⚠️ **确认数据库迁移**（需要检查）
   ```bash
   cd apps/api
   python manage.py showmigrations
   python manage.py migrate  # 如果有未应用的迁移
   ```
3. 🔴 **创建序列化器**（必需）
4. 🔴 **创建 API 视图**（必需）
5. 🔴 **配置 URL 路由**（必需）
6. 🔴 **创建数据迁移**（为现有项目创建默认类型）
7. 🔴 **添加信号处理器**（为新项目自动创建默认类型）
8. 🟡 **编写单元测试**（推荐）
9. 🟡 **API 集成测试**（推荐）
10. 🟢 **前端集成**（在后端完成后）

---

## 附加发现 📌

### Project 序列化器中的标志

**文件：** `/opt/code/plane/apps/api/plane/api/serializers/project.py:91`

```python
"is_issue_type_enabled",
```

这表明项目可能有一个开关来启用/禁用工作项类型功能。需要检查：

1. 这个字段的用途
2. 是否需要在前端控制这个功能的可见性

---

## 结论与建议 🎯

### 当前状态

**数据层：** ✅ 完整
**业务逻辑层：** ❌ 缺失
**API 层：** ❌ 完全缺失
**前端：** ❌ 未开始

### 工作量评估

| 任务         | 复杂度 | 预估时间   |
| ------------ | ------ | ---------- |
| 后端序列化器 | 低     | 0.5-1 天   |
| 后端视图     | 中     | 1-2 天     |
| URL 路由     | 低     | 0.5 天     |
| 数据迁移     | 中     | 0.5-1 天   |
| 信号处理     | 低     | 0.5 天     |
| 后端测试     | 中     | 1-2 天     |
| **后端总计** | -      | **4-7 天** |

### 建议

1. **优先实施后端 API**
   - 没有后端 API，前端无法开发
   - 建议先完成后端开发并测试通过

2. **数据迁移策略**
   - 为所有现有项目创建默认 "Task" 类型
   - 将所有现有 Issues 关联到默认类型
   - 新建项目自动创建默认类型

3. **API 设计参考**
   - 参考现有的 State、Label 等项目配置 API
   - 保持与现有代码风格一致
   - 使用 Django REST framework ViewSets

4. **权限控制**
   - 参考现有的项目设置权限
   - 只有项目管理员可以管理工作项类型

5. **删除保护**
   - 禁止删除有关联 Issues 的类型
   - 或提供"软删除"（is_active = False）

---

**报告生成时间：** 2025-12-12
**验证人员：** Claude Code Assistant
**状态：** ⚠️ **需要完整实现后端 API**
