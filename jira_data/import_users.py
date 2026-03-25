#!/usr/bin/env python3
"""
从 prod_user_import.json 批量导入用户到目标环境（生产专用）

用法：
  python import_users.py --env prod

功能：
  - 从 jira_data/prod_user_import.json 读取用户数据
  - 通过 Docker Django Shell 批量创建 User（保留原始 password hash 和 UUID）
  - 幂等：按 email 检查，已存在则跳过
  - 将用户加入 workspace（WorkspaceMember）
  - 输出统计报告
"""

import argparse
import json
import os
import subprocess
import sys
import textwrap

DIR = os.path.dirname(os.path.abspath(__file__))

ENV_CONFIG = {
    "dev":  {"container": "plane-api-1",  "workspace_slug": "ficc"},
    "prod": {"container": "api", "workspace_slug": "ficc"},
}


def run_django_shell(container: str, script: str) -> str:
    """在目标 Docker 容器中执行 Django Shell 脚本，返回 stdout"""
    cmd = ["docker", "exec", "-i", container, "python", "manage.py", "shell"]
    result = subprocess.run(
        cmd,
        input=script,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        print(f"Django Shell 错误:\n{result.stderr}", file=sys.stderr)
        raise RuntimeError(f"Django Shell 退出码 {result.returncode}")
    return result.stdout


def build_import_script(users: list, workspace_slug: str) -> str:
    """生成批量创建 User 的 Django Shell 脚本"""
    users_json = json.dumps(users, ensure_ascii=False)
    return textwrap.dedent(f"""
import json
from plane.db.models import User, Workspace, WorkspaceMember

users_data = json.loads('''{users_json}''')
workspace_slug = '{workspace_slug}'

ws = Workspace.objects.filter(slug=workspace_slug).first()
if not ws:
    print(f'ERROR: workspace {{workspace_slug}} not found')
    exit(1)

created = skipped = failed = 0

for u in users_data:
    email = u['email']
    try:
        if User.objects.filter(email=email).exists():
            print(f'跳过(已存在): {{email}}')
            skipped += 1
            # 确保已在 workspace 中
            existing = User.objects.get(email=email)
            WorkspaceMember.objects.get_or_create(
                workspace=ws, member=existing,
                defaults={{'role': u['workspace_role'], 'is_active': True}}
            )
            continue

        user = User(
            id=u['id'],
            email=email,
            username=u.get('username') or email,
            display_name=u['display_name'],
            employee_id=u.get('employee_id') or '',
            department=u.get('department') or '',
            team=u.get('team') or '',
            is_active=u.get('is_active', True),
            is_email_verified=u.get('is_email_verified', True),
        )
        user.password = u['password']
        user.save()

        WorkspaceMember.objects.get_or_create(
            workspace=ws, member=user,
            defaults={{'role': u['workspace_role'], 'is_active': True}}
        )

        print(f'已创建: {{email}}')
        created += 1

    except Exception as e:
        print(f'失败: {{email}} — {{e}}')
        failed += 1

print(f'SUMMARY: created={{created}} skipped={{skipped}} failed={{failed}}')
""")


def main():
    parser = argparse.ArgumentParser(description="批量导入用户到 Plane 环境")
    parser.add_argument("--env", choices=["dev", "prod"], default="dev",
                        help="目标环境（dev|prod），默认 dev")
    args = parser.parse_args()

    cfg = ENV_CONFIG[args.env]
    container = cfg["container"]
    workspace_slug = cfg["workspace_slug"]

    users_path = os.path.join(DIR, "prod_user_import.json")
    if not os.path.exists(users_path):
        print(f"错误：找不到 {users_path}", file=sys.stderr)
        sys.exit(1)

    with open(users_path, encoding="utf-8") as f:
        users = json.load(f)

    print(f"环境: {args.env}  容器: {container}  用户数: {len(users)}")
    print("开始导入用户 ...")

    script = build_import_script(users, workspace_slug)
    output = run_django_shell(container, script)
    print(output)

    # 解析统计
    for line in output.splitlines():
        if line.startswith("SUMMARY:"):
            parts = dict(kv.split("=") for kv in line[len("SUMMARY:"):].split())
            print(f"\n✅ 创建: {parts.get('created', '?')}，"
                  f"跳过: {parts.get('skipped', '?')}，"
                  f"失败: {parts.get('failed', '?')}")
            break


if __name__ == "__main__":
    main()
