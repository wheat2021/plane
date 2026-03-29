---
name: plane-api
description: "⚠️ DEPRECATED: 已合并到 plane-data。请使用 plane-data skill。"
license: MIT
metadata:
  author: ficc-local
  version: "1.0"
---

# Plane API 操作助手（FICC 专用）

## 调用形式

```
/plane-api <操作描述> [--env dev|prod]
```

示例：

- `/plane-api 查看所有 Cycle`
- `/plane-api 创建 issue "需求标题" --env prod`
- `/plane-api 把 issue abc123 加入 Cycle 0523`
- `/plane-api 查询 assignee 是 xiaqing 的 issue`

默认环境为 `dev`，明确说"生产"或 `--env prod` 时切换到生产。

---

## 环境配置

### Dev 环境

```
BASE_URL    = http://localhost:8000
API_TOKEN   = plane_api_7ad39eb392a542f59bcc59e8fcb92b9d
WORKSPACE   = ficc
PROJECT_ID  = 18b7ccc8-4b96-4af0-8c6f-76550cba28a7
CONTAINER   = plane-api-1
```

### 生产环境

```
BASE_URL    = http://10.102.21.231:8080
API_TOKEN   = plane_api_592e30b2a377449db5a6238eb6f54f3b
WORKSPACE   = ficc
PROJECT_ID  = f5a45eb3-66a3-48cb-8c96-d09f80791645
CONTAINER   = api（SSH: appadmin@10.102.21.231）
SERVER      = appadmin@10.102.21.231
```

### 认证 Header

所有 REST API 请求使用：

```
X-Api-Key: <API_TOKEN>
Content-Type: application/json
```

---

## API vs Django Shell 选择规则

| 条件                    | 推荐方式                               |
| ----------------------- | -------------------------------------- |
| 操作 ≤ 20 条            | REST API                               |
| 操作 > 50 条            | Django Shell                           |
| 需要触发活动日志/通知   | REST API                               |
| 涉及已完成 Cycle 的关联 | Django Shell                           |
| 创建 Cycle / Module     | Django Shell（REST API 有 bug）        |
| 批量创建 Issue          | Django Shell（需手动处理 sequence_id） |
| 查询操作                | REST API（更方便）                     |
| 需要复杂 ORM 查询       | Django Shell                           |

**Django Shell 执行方式**：

```bash
# Dev
docker exec -i plane-api-1 python manage.py shell << 'EOF'
...
EOF

# 生产（先 SSH）
ssh appadmin@10.102.21.231 "docker exec -i api python manage.py shell << 'EOF'
...
EOF"
```

---

## REST API 速查表

### Issue

```bash
# 列表（支持过滤）
GET  /api/v1/workspaces/{ws}/projects/{pid}/issues/?state={state_id}&assignees={user_id}

# 创建
POST /api/v1/workspaces/{ws}/projects/{pid}/issues/
{
  "name": "标题",
  "description_html": "<p>描述</p>",
  "type_id": "<IssueType UUID>",
  "state": "<State UUID>",        # 注意：字段名是 state，不是 state_id
  "priority": "none|low|medium|high|urgent",
  "assignees": ["<user_uuid>"],
  "extra_properties": {"key": "value"}
}

# 更新
PATCH /api/v1/workspaces/{ws}/projects/{pid}/issues/{issue_id}/
{"state": "<new_state_uuid>"}

# 删除
DELETE /api/v1/workspaces/{ws}/projects/{pid}/issues/{issue_id}/
```

### Cycle

```bash
# 列表
GET  /api/v1/workspaces/{ws}/projects/{pid}/cycles/?per_page=50

# 关联 issue（未完成 Cycle 才可用，已完成用 Django Shell）
POST /api/v1/workspaces/{ws}/projects/{pid}/cycles/{cycle_id}/cycle-issues/
{"issues": ["<issue_uuid>", ...]}

# 移除关联
DELETE /api/v1/workspaces/{ws}/projects/{pid}/cycles/{cycle_id}/cycle-issues/
{"issues": ["<issue_uuid>"]}
```

### Module

```bash
# 列表
GET  /api/v1/workspaces/{ws}/projects/{pid}/modules/?per_page=100

# 关联 issue
POST /api/v1/workspaces/{ws}/projects/{pid}/modules/{module_id}/module-issues/
{"issues": ["<issue_uuid>", ...]}
```

### State / Member / IssueType

```bash
# 项目 States
GET  /api/v1/workspaces/{ws}/projects/{pid}/states/

# Workspace Members（含 display_name → UUID 映射）
GET  /api/v1/workspaces/{ws}/members/

# IssueTypes（需 Django Shell，REST 不支持）
docker exec -i <container> python manage.py shell << 'EOF'
from plane.db.models import IssueType, Workspace
ws = Workspace.objects.get(slug='ficc')
for t in IssueType.objects.filter(workspace=ws):
    print(t.id, t.name)
EOF
```

### Extra Properties

```bash
# 查询某 IssueType 的 EP 定义（Django Shell）
from plane.db.models import IssueTypeExtraProperty, IssueType, Workspace, Project
ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
req_type = IssueType.objects.get(workspace=ws, name='Requirement')
for b in IssueTypeExtraProperty.objects.filter(project=proj, issue_type=req_type).select_related('extra_property_config'):
    ep = b.extra_property_config
    print(f'{ep.key} ({ep.type}): {ep.label}')
```

---

## 常用 Django Shell 操作

### 查询用户 UUID（by email 或 display_name）

```python
from plane.db.models import User
u = User.objects.filter(email='xiaqing@htsc.com').first()
print(u.id, u.display_name)
```

### 查询 issue

```python
from plane.db.models import Issue, IssueType, Workspace, Project
ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
issues = Issue.objects.filter(project=proj, name__contains='关键词')
for i in issues:
    print(i.sequence_id, i.name, i.state.name)
```

### 批量创建 Issue（含 sequence_id 修复）

```python
from plane.db import transaction
from plane.db.models import Issue, IssueSequence
from django.db.models import Max

with transaction.atomic():
    objs = Issue.objects.bulk_create([Issue(...) for ...])
    # 修复 sequence_id（bulk_create 绕过 save()）
    last_seq = IssueSequence.objects.filter(project=proj).aggregate(m=Max('sequence'))['m'] or 0
    for idx, issue in enumerate(objs, 1):
        issue.sequence_id = last_seq + idx
    Issue.objects.bulk_update(objs, ['sequence_id'])
    IssueSequence.objects.bulk_create([
        IssueSequence(issue=i, sequence=i.sequence_id, project=proj, workspace=ws)
        for i in objs
    ], ignore_conflicts=True)
```

### 关联已完成 Cycle（API 返回 400 时用此方法）

```python
from plane.db.models import CycleIssue, Cycle, ProjectMember
cycle = Cycle.objects.get(id='<cycle_id>')
user = ProjectMember.objects.filter(project=proj).order_by('created_at').first().member
CycleIssue.objects.get_or_create(
    workspace=ws, project=proj, cycle=cycle, issue_id='<issue_id>',
    defaults={'created_by': user, 'updated_by': user}
)
```

---

## 已知坑

| 坑                      | 说明                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `state` vs `state_id`   | REST API 创建 issue 用 `"state": <UUID>`，不是 `"state_id"`          |
| 已完成 Cycle 关联       | API 返回 `400 CYCLE_COMPLETED`，改用 Django Shell                    |
| 创建 Cycle/Module       | REST API 返回 "Project ID is required"，必须用 Django Shell          |
| bulk_create sequence_id | 全部为 1，需手动分配并创建 IssueSequence 记录                        |
| Python 3.7 兼容性       | 生产服务器 Python 3.7，不支持 `list[dict]`、`dict[str,str]` 类型注解 |
| import_users username   | 创建用户时必须设置 `username=email`，否则唯一约束冲突                |
| 生产 API Token          | 需通过 Django Shell 查询，不在配置文件中                             |

---

## 快速示例

### curl（Dev）

```bash
# 查询所有 Cycle
curl -s "http://localhost:8000/api/v1/workspaces/ficc/projects/18b7ccc8-4b96-4af0-8c6f-76550cba28a7/cycles/" \
  -H "X-Api-Key: plane_api_7ad39eb392a542f59bcc59e8fcb92b9d" | python3 -m json.tool

# 创建 issue
curl -s -X POST \
  "http://localhost:8000/api/v1/workspaces/ficc/projects/18b7ccc8-4b96-4af0-8c6f-76550cba28a7/issues/" \
  -H "X-Api-Key: plane_api_7ad39eb392a542f59bcc59e8fcb92b9d" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试需求","state":"4657dc96-1572-41e3-becd-0ba3d4ff8e22","priority":"none","type_id":"5e8c9352-8553-4e87-97dc-88594010f83a"}'
```

### Python（通用）

```python
import requests

ENV = {
    "dev": {
        "base": "http://localhost:8000",
        "token": "plane_api_7ad39eb392a542f59bcc59e8fcb92b9d",
        "ws": "ficc",
        "pid": "18b7ccc8-4b96-4af0-8c6f-76550cba28a7",
    },
    "prod": {
        "base": "http://10.102.21.231:8080",
        "token": "<从Django Shell查询>",
        "ws": "ficc",
        "pid": "f5a45eb3-66a3-48cb-8c96-d09f80791645",
    },
}

def api(env, method, path, **kwargs):
    cfg = ENV[env]
    url = f"{cfg['base']}/api/v1/workspaces/{cfg['ws']}/projects/{cfg['pid']}{path}"
    headers = {"X-Api-Key": cfg["token"], "Content-Type": "application/json"}
    return requests.request(method, url, headers=headers, **kwargs)

# 示例
r = api("dev", "GET", "/cycles/")
r = api("dev", "POST", "/issues/", json={"name": "xxx", "state": "...", "priority": "none"})
```
