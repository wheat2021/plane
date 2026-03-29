# Issue 操作模板

## 批量创建 Issue（完整事务）

```python
import uuid, json
from django.db import transaction
from django.db.models import Max
from plane.db.models import (
    Issue, IssueAssignee, IssueSequence, IssueType,
    Workspace, Project, ProjectMember
)

ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
admin = ProjectMember.objects.filter(project=proj, role=20).first().member
issue_type = IssueType.objects.get(workspace=ws, name='<TypeName>')

# issues_data = [{name, state_id, extra_properties, assignee_ids}, ...]

with transaction.atomic():
    new_issues = []
    for d in issues_data:
        new_issues.append(Issue(
            id=uuid.uuid4(), workspace=ws, project=proj,
            name=d['name'], description_html=d.get('description_html', '<p></p>'),
            type_id=issue_type.id, state_id=d['state_id'],
            priority='none', extra_properties=d.get('extra_properties', {}),
            created_by=admin, updated_by=admin,
        ))

    Issue.objects.bulk_create(new_issues)

    # ⚠️ 修复 sequence_id（bulk_create 绕过 save()）
    last_seq = IssueSequence.objects.filter(project=proj).aggregate(m=Max('sequence'))['m'] or 0
    for idx, issue in enumerate(new_issues, 1):
        issue.sequence_id = last_seq + idx
    Issue.objects.bulk_update(new_issues, ['sequence_id'])

    IssueSequence.objects.bulk_create([
        IssueSequence(id=uuid.uuid4(), issue=i, sequence=i.sequence_id,
                      project=proj, workspace=ws, created_by=admin, updated_by=admin)
        for i in new_issues
    ], ignore_conflicts=True)

print(f'Created {len(new_issues)} issues')
```

## 批量更新 Issue（逐条 save）

适用于需要按条件更新不同字段的场景：

```python
issues = Issue.objects.filter(project=proj, type_id=issue_type.id)
for issue in issues:
    new_state = state_map.get(issue.name)
    if new_state and str(issue.state_id) != new_state:
        issue.state_id = new_state
        ep = issue.extra_properties or {}
        ep['some_key'] = 'some_value'
        issue.extra_properties = ep
        issue.save(update_fields=['state_id', 'extra_properties'])
```

## 快速批量状态变更（QuerySet.update）

适用于同一条件下所有 issue 改为同一状态：

```python
count = Issue.objects.filter(
    project=proj, type_id=issue_type.id, state_id='<old_state_id>'
).update(state_id='<new_state_id>')
print(f'Updated {count} issues')
```

## 批量创建 Assignee

```python
IssueAssignee.objects.bulk_create([
    IssueAssignee(
        id=uuid.uuid4(), issue_id=issue_id, assignee_id=user_id,
        project=proj, workspace=ws, created_by=admin, updated_by=admin,
    )
    for issue_id, user_id in assignee_pairs
], ignore_conflicts=True)
```

## 批量创建 Relation

```python
from plane.db.models import IssueRelation

IssueRelation.objects.bulk_create([
    IssueRelation(
        id=uuid.uuid4(),
        issue_id=source_id,          # 例如 BG issue
        related_issue_id=target_id,   # 例如 Strategy issue
        relation_type='relates_to',   # relates_to | blocked_by | duplicate
        project=proj, workspace=ws,
        created_by=admin, updated_by=admin,
    )
    for source_id, target_id in relation_pairs
], ignore_conflicts=True)
```

## 批量创建 Label 关联

```python
from plane.db.models import IssueLabel, Label

label = Label.objects.get(project=proj, name='<LabelName>')
IssueLabel.objects.bulk_create([
    IssueLabel(
        id=uuid.uuid4(), issue=issue, label=label,
        project=proj, workspace=ws, created_by=admin, updated_by=admin,
    )
    for issue in target_issues
], ignore_conflicts=True)
```

## Cycle / Module 关联

```python
from plane.db.models import CycleIssue, ModuleIssue

# Cycle（支持已完成 Cycle，REST API 不支持）
CycleIssue.objects.bulk_create([
    CycleIssue(
        id=uuid.uuid4(), cycle_id=cycle_id, issue_id=issue_id,
        project=proj, workspace=ws, created_by=admin, updated_by=admin,
    )
    for issue_id in issue_ids
], ignore_conflicts=True)

# Module
ModuleIssue.objects.bulk_create([
    ModuleIssue(
        id=uuid.uuid4(), module_id=module_id, issue_id=issue_id,
        project=proj, workspace=ws, created_by=admin, updated_by=admin,
    )
    for issue_id in issue_ids
], ignore_conflicts=True)
```

## 数据比对（Plane vs 外部数据源）

```python
# 获取 Plane 已有 issue names
existing = set(
    Issue.objects.filter(project=proj, type_id=issue_type.id)
    .values_list('name', flat=True)
)

# 外部数据 names
source = set(d['name'] for d in source_data)

plane_only = existing - source    # Plane 有但外部没有
source_only = source - existing   # 外部有但 Plane 没有
common = existing & source        # 两边都有

print(f'Plane only: {len(plane_only)}, Source only: {len(source_only)}, Common: {len(common)}')
```

## 删除 Issue

```python
# 按条件删除（级联删除 assignee/relation/label/sequence 等）
deleted = Issue.objects.filter(project=proj, type_id=issue_type.id, name__in=[...]).delete()
print(f'Deleted: {deleted}')
```
