"""
Phase 0: 创建用户 + Workspace Member + AURORA Project Member
在 Dev 环境 Django Shell 中执行
"""
import json
import uuid

# --- 用户数据 ---
USERS_JSON = '''__USERS_PLACEHOLDER__'''

users = json.loads(USERS_JSON)

from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember

ws = Workspace.objects.get(slug='ficc')
aurora = Project.objects.get(id='18b7ccc8-4b96-4af0-8c6f-76550cba28a7')

# 获取一个已有 admin 作为 created_by
admin = ProjectMember.objects.filter(project=aurora, role=20).first().member

created_users = 0
created_ws_members = 0
created_proj_members = 0
skipped = 0

for u_data in users:
    email = u_data['email']
    display_name = u_data['display_name']

    # 检查用户是否已存在
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create(
            id=uuid.uuid4(),
            email=email,
            username=email,  # 必须设置，否则唯一约束冲突
            display_name=display_name,
            is_active=True,
            is_password_autoset=True,
        )
        created_users += 1
    else:
        skipped += 1

    # WorkspaceMember
    wm, wm_created = WorkspaceMember.objects.get_or_create(
        workspace=ws, member=user,
        defaults={'role': 15, 'created_by': admin, 'updated_by': admin}
    )
    if wm_created:
        created_ws_members += 1

    # ProjectMember (AURORA, role=15 Member)
    pm, pm_created = ProjectMember.objects.get_or_create(
        project=aurora, member=user,
        defaults={'role': 15, 'workspace': ws, 'created_by': admin, 'updated_by': admin}
    )
    if pm_created:
        created_proj_members += 1

print(f'Users created: {created_users}, skipped(existing): {skipped}')
print(f'WorkspaceMembers created: {created_ws_members}')
print(f'ProjectMembers(AURORA) created: {created_proj_members}')
