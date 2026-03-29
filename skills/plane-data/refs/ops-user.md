# 用户操作模板

## 创建用户 + WorkspaceMember + ProjectMember（幂等）

```python
import uuid
from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember

ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='<PROJECT_ID>')
admin = ProjectMember.objects.filter(project=proj, role=20).first().member

# users_data = [{"display_name": "张三", "email": "zhangsan@htsc.com"}, ...]

for u_data in users_data:
    user, u_created = User.objects.get_or_create(
        email=u_data['email'],
        defaults={
            'id': uuid.uuid4(),
            'username': u_data['email'],   # ⚠️ 必须设为 email
            'display_name': u_data['display_name'],
            'is_active': True,
            'is_password_autoset': True,
        }
    )
    WorkspaceMember.objects.get_or_create(
        workspace=ws, member=user,
        defaults={'role': 15, 'created_by': admin, 'updated_by': admin}
    )
    ProjectMember.objects.get_or_create(
        project=proj, member=user,
        defaults={'role': 15, 'workspace': ws, 'created_by': admin, 'updated_by': admin}
    )
```

## 修复 display_name（unicode 转义问题）

如果用 heredoc 创建了用户导致 display_name 是 unicode 转义字符串：

```python
fixes = {"zhangsan@htsc.com": "张三", ...}
for email, name in fixes.items():
    u = User.objects.filter(email=email).first()
    if u and u.display_name != name:
        u.display_name = name
        u.save(update_fields=['display_name'])
```

> **预防**：用 `subprocess.run(input=script)` 传递脚本，不要用 heredoc 嵌中文。

## 用户比对（外部名单 vs Plane）

```python
from plane.db.models import User, WorkspaceMember, Workspace

ws = Workspace.objects.get(slug='ficc')
existing = {
    wm.member.display_name: wm.member
    for wm in WorkspaceMember.objects.filter(workspace=ws).select_related('member')
}

needed_names = ["张三", "李四", ...]  # 外部数据中的人员

found = [(n, existing[n].email) for n in needed_names if n in existing]
not_found = [n for n in needed_names if n not in existing]

print(f'Found: {len(found)}, Need to create: {len(not_found)}')
```

## 名字变体合并

源数据中同一人可能有不同写法，在处理前统一：

```python
NAME_ALIAS = {
    "冼启棉": "冼啟棉",
    "汤加红": "汤家红",
    "刘麟轩": "刘麒轩",
}

def normalize_name(name):
    return NAME_ALIAS.get(name.strip(), name.strip())
```

## 构建 display_name → UUID 映射

用于 assignee 和 member EP 的值填充：

```python
user_map = {u.display_name: str(u.id) for u in User.objects.all()}

# 填充 assignee
uid = user_map.get(display_name)
if uid:
    assignee_pairs.append((issue_id, uid))

# 填充 member EP
if developer_name in user_map:
    ep['developer'] = user_map[developer_name]
```
