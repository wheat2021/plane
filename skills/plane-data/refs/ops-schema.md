# Schema 操作模板

> 创建/修改 IssueType、ExtraPropertyConfig、State、Label。所有操作用 Django Shell。

## 创建 IssueType

```python
import uuid
from plane.db.models import IssueType, Workspace
ws = Workspace.objects.get(slug='ficc')

issue_type, created = IssueType.objects.get_or_create(
    workspace=ws, name='<TypeName>',
    defaults={
        'id': uuid.uuid4(),
        'description': '<描述>',
        'logo_props': {"in_use": "icon", "icon": {"name": "<lucide-icon>", "color": "#0ea5e9"}},
        'is_default': False, 'is_active': True,
        'level': 7,  # 查现有 level 后选一个不冲突的
        'is_system': False,
    }
)
print(f'{issue_type.name}: {issue_type.id} (created={created})')
```

常用 icon: `file-text`(需求), `book-open`(故事), `bug`(缺陷), `brain-circuit`(策略), `server`(集群), `network`(业务组), `flag`(里程碑), `file-chart`(报告)

## 创建 ExtraPropertyConfig + 绑定

```python
import uuid
from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty, IssueType, Project, Workspace, ProjectMember

ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
admin = ProjectMember.objects.filter(project=proj, role=20).first().member
issue_type = IssueType.objects.get(workspace=ws, name='<TypeName>')

# --- select ---
config, c = ExtraPropertyConfig.objects.get_or_create(
    workspace=ws, key='<key>',
    defaults={
        'id': uuid.uuid4(), 'label': '<显示名>', 'type': 'select',
        'config': {"options": [{"value": "v1", "label": "显示名1"}, {"value": "v2"}]},
        'created_by': admin, 'updated_by': admin,
    }
)

# --- multiselect --- (config 结构同 select)

# --- member ---
config, c = ExtraPropertyConfig.objects.get_or_create(
    workspace=ws, key='<key>',
    defaults={
        'id': uuid.uuid4(), 'label': '<显示名>', 'type': 'member',
        'config': {"member_color": "#6366f1"},
        'created_by': admin, 'updated_by': admin,
    }
)

# --- text / textarea ---
config, c = ExtraPropertyConfig.objects.get_or_create(
    workspace=ws, key='<key>',
    defaults={
        'id': uuid.uuid4(), 'label': '<显示名>', 'type': 'text',
        'config': {},
        'created_by': admin, 'updated_by': admin,
    }
)

# 绑定到 IssueType（⚠️ 不传 workspace）
binding, b = IssueTypeExtraProperty.objects.get_or_create(
    project=proj, issue_type=issue_type, extra_property_config=config,
    defaults={'is_required': False, 'created_by': admin, 'updated_by': admin}
)
```

## 创建 State

```python
from plane.db.models import State, Project
proj = Project.objects.get(id='<PROJECT_ID>')

state, created = State.objects.get_or_create(
    project=proj, name='<StateName>',
    defaults={'color': '#F59E0B', 'group': 'started'}  # group: backlog|unstarted|started|completed|cancelled
)
```

## 创建 Label

```python
import uuid
from plane.db.models import Label, Project, Workspace, ProjectMember

ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
admin = ProjectMember.objects.filter(project=proj, role=20).first().member

label, created = Label.objects.get_or_create(
    project=proj, name='<LabelName>',
    defaults={
        'id': uuid.uuid4(), 'workspace': ws, 'color': '#ef4444',
        'created_by': admin, 'updated_by': admin,
    }
)
```

## 删除 IssueType 及关联数据

```python
from plane.db.models import IssueType, IssueTypeExtraProperty, Issue, Workspace, Project
ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
it = IssueType.objects.get(workspace=ws, name='<TypeName>')

# 先删 issues（级联删除 assignee/relation/label 等）
Issue.objects.filter(project=proj, type_id=it.id).delete()
# 删 EP bindings
IssueTypeExtraProperty.objects.filter(project=proj, issue_type=it).delete()
# 删 type
it.delete()
```
