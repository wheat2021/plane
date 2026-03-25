#!/usr/bin/env python3
"""
创建 Cycles/Modules 并从 requirements_import_ready.csv 批量导入 Requirement issues

用法：
  python3 reimport_all.py --env dev           # 本机验证
  python3 reimport_all.py --env dev --clean   # 先清空再导入
  python3 reimport_all.py --env prod          # 生产（在生产服务器上运行）

全流程通过 Django Shell ORM 操作，无限流风险，支持已完成 Cycle。
0131/0307/0328/0425 迭代的 issue 使用 Cancelled 终态；0523 保持 Backlog。
"""

import argparse
import csv
import json
import os
import subprocess
import sys
import textwrap
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))

# ── 环境配置 ──────────────────────────────────────────────────────────────────
ENV_CONFIG = {
    "dev": {
        "base_url":   "http://localhost:8000",
        "api_token":  "plane_api_7ad39eb392a542f59bcc59e8fcb92b9d",
        "workspace":  "ficc",
        "project_id": "18b7ccc8-4b96-4af0-8c6f-76550cba28a7",
        "container":  "plane-api-1",
    },
    "prod": {
        "base_url":   os.environ.get("PROD_BASE_URL", "http://localhost:8000"),
        "api_token":  os.environ.get("PROD_API_TOKEN", ""),
        "workspace":  "ficc",
        "project_id": os.environ.get("PROD_PROJECT_ID", "18b7ccc8-4b96-4af0-8c6f-76550cba28a7"),
        "container":  "plane-api-1",
    },
}

# ── Cycle 配置 ────────────────────────────────────────────────────────────────
CYCLES = [
    {"name": "大象-常规-26-0131", "start": "2026-01-19", "end": "2026-01-30"},
    {"name": "大象-常规-26-0307", "start": "2026-02-17", "end": "2026-03-06"},
    {"name": "大象-常规-26-0328", "start": "2026-03-09", "end": "2026-03-27"},
    {"name": "大象-常规-26-0425", "start": "2026-03-30", "end": "2026-04-24"},
    {"name": "大象-常规-26-0523", "start": "2026-04-27", "end": "2026-05-22"},
]

# 工号 → 姓名（用于 Module Assignee，Jira modules.csv 存储工号）
EMP_ID_UUID: dict[str, str] = {
    "025246": "b0c16d7f-e6db-46ed-b34e-ff2059b1c211",
    "025241": "e7b11737-6f57-458f-9892-5a168e411edf",
    "024868": "535b3838-1804-4a1f-8353-5320babd97b8",
    "023824": "daa28f62-9d59-4c8a-9c93-28d931e72b99",
    "019040": "9a969130-2666-4604-9326-c2b17ca09ef1",
    "017573": "74c21a3b-1b9b-47f2-b7ab-b8195738260d",
    "019521": "86316c00-0847-43a8-8176-834f264e0307",
    "015260": "8baed4ad-64c0-4922-b4bb-e9d77a865fd7",
    "010713": "ee12bda6-18fc-4ad5-a35e-74c256781157",
    "017436": "0d5d1a69-68ee-4885-9bb7-bf93e92eb4aa",
    "017433": "98cb9446-ac30-4857-9c77-644999e62d52",
    "017485": "ee31178b-09ee-4d85-a3dd-7302c10c3af5",
    "015964": "14b265fe-200d-46aa-8e25-66f57a1e130d",
    "019521": "86316c00-0847-43a8-8176-834f264e0307",
    "015260": "8baed4ad-64c0-4922-b4bb-e9d77a865fd7",
    "018045": "77342d2f-a6cf-4a2d-8142-2f5f84d0636a",
}


# ── 工具函数 ──────────────────────────────────────────────────────────────────

def run_django_shell(container: str, script: str) -> str:
    """在 Docker 容器中执行 Django Shell 脚本"""
    cmd = ["docker", "exec", "-i", container, "python", "manage.py", "shell"]
    result = subprocess.run(cmd, input=script, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        print(f"Django Shell stderr:\n{result.stderr}", file=sys.stderr)
        raise RuntimeError(f"Django Shell 退出码 {result.returncode}")
    return result.stdout





# ── Step 1: 清空 Requirement issues ──────────────────────────────────────────

def clean_requirements(cfg: dict):
    print("\n[--clean] 清空所有 Requirement issues ...")
    script = textwrap.dedent(f"""
from plane.db.models import Issue, IssueType, Project, Workspace
ws = Workspace.objects.filter(slug='{cfg["workspace"]}').first()
proj = Project.objects.filter(workspace=ws, id='{cfg["project_id"]}').first()
req_type = IssueType.objects.filter(workspace=ws, name='Requirement').first()
if req_type:
    qs = Issue.objects.filter(project=proj, type_id=req_type.id)
    cnt = qs.count()
    qs.delete()
    print(f'已删除 {{cnt}} 条 Requirement issues')
else:
    print('未找到 Requirement type')
""")
    out = run_django_shell(cfg["container"], script)
    print(out.strip())


# ── Step 2: lookup-or-create Cycles ──────────────────────────────────────────

def ensure_cycles(cfg: dict) -> dict[str, str]:
    """返回 {cycle_name: cycle_id}"""
    print("\n[Step 2] 创建/查找 Cycles ...")

    cycles_json = json.dumps(CYCLES, ensure_ascii=False)
    script = textwrap.dedent(f"""
import json
from plane.db.models import Cycle, Project, ProjectMember, Workspace
from django.utils import timezone

ws = Workspace.objects.filter(slug='{cfg["workspace"]}').first()
proj = Project.objects.filter(workspace=ws, id='{cfg["project_id"]}').first()
user = ProjectMember.objects.filter(project=proj).order_by('created_at').first().member

cycles_cfg = json.loads('''{cycles_json}''')
result = {{}}

for c in cycles_cfg:
    name = c['name']
    existing = Cycle.objects.filter(project=proj, name=name).first()
    if existing:
        print(f'♻️  复用 Cycle: {{name}}')
        result[name] = str(existing.id)
    else:
        obj = Cycle.objects.create(
            workspace=ws, project=proj, name=name,
            start_date=c['start'] + 'T00:00:01+08:00',
            end_date=c['end'] + 'T23:59:00+08:00',
            owned_by=user, created_by=user, updated_by=user,
        )
        print(f'✅ 创建 Cycle: {{name}}')
        result[name] = str(obj.id)

print('CYCLE_MAP:' + json.dumps(result, ensure_ascii=False))
""")
    out = run_django_shell(cfg["container"], script)
    print(out.strip())

    for line in out.splitlines():
        if line.startswith("CYCLE_MAP:"):
            return json.loads(line[len("CYCLE_MAP:"):])
    raise RuntimeError("未能解析 CYCLE_MAP")


# ── Step 3: lookup-or-create Modules from Jira modules.csv ───────────────────

def ensure_modules(cfg: dict) -> dict[str, str]:
    """返回 {module_name: module_id}"""
    print("\n[Step 3] 创建/查找 Modules ...")

    modules_csv = os.path.join(DIR, "Jira modules.csv")
    modules_data = []
    with open(modules_csv, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            name = row.get("Summary", "").strip()
            ext_id = row.get("Issue key", "").strip()
            assignee_emp = row.get("Assignee", "").strip()
            if name:
                modules_data.append({
                    "name": name,
                    "external_id": ext_id,
                    "lead_uuid": EMP_ID_UUID.get(assignee_emp, ""),
                })

    modules_json = json.dumps(modules_data, ensure_ascii=False)
    script = textwrap.dedent(f"""
import json
from plane.db.models import Module, Project, ProjectMember, User, Workspace

ws = Workspace.objects.filter(slug='{cfg["workspace"]}').first()
proj = Project.objects.filter(workspace=ws, id='{cfg["project_id"]}').first()
user = ProjectMember.objects.filter(project=proj).order_by('created_at').first().member

modules_data = json.loads('''{modules_json}''')
result = {{}}

for m in modules_data:
    name = m['name']
    existing = Module.objects.filter(project=proj, name=name).first()
    if existing:
        print(f'♻️  复用 Module: {{name}}')
        result[name] = str(existing.id)
        continue

    lead = None
    if m['lead_uuid']:
        lead = User.objects.filter(id=m['lead_uuid']).first()
        if not lead:
            print(f'  ⚠ lead UUID 未找到: {{m["lead_uuid"]}}')

    kwargs = dict(
        workspace=ws, project=proj, name=name,
        status='backlog', external_source='jira',
        external_id=m['external_id'],
        created_by=user, updated_by=user,
    )
    if lead:
        kwargs['lead'] = lead

    obj = Module.objects.create(**kwargs)

    # 添加 lead 为 module member
    if lead:
        from plane.db.models import ModuleMember
        ModuleMember.objects.get_or_create(
            module=obj, member=lead,
            defaults={{'created_by': user, 'updated_by': user}}
        )

    print(f'✅ 创建 Module: {{name}}')
    result[name] = str(obj.id)

print('MODULE_MAP:' + json.dumps(result, ensure_ascii=False))
""")
    out = run_django_shell(cfg["container"], script)
    print(out.strip())

    for line in out.splitlines():
        if line.startswith("MODULE_MAP:"):
            return json.loads(line[len("MODULE_MAP:"):])
    raise RuntimeError("未能解析 MODULE_MAP")


# 已结束迭代（使用 Cancelled 终态）
CLOSED_CYCLES = {"大象-常规-26-0131", "大象-常规-26-0307", "大象-常规-26-0328", "大象-常规-26-0425"}


# ── Step 4: 从 CSV 导入 Issues（Django Shell bulk_create）────────────────────

def import_issues(cfg: dict, cycle_map: dict, module_map: dict):
    print("\n[Step 4] 从 CSV 导入 Requirement issues (Django Shell) ...")

    csv_path = os.path.join(DIR, "requirements_import_ready.csv")
    with open(csv_path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    ws = cfg["workspace"]
    project_id = cfg["project_id"]

    # 构建传入 Django Shell 的数据
    issues_data = []
    for i, row in enumerate(rows, 1):
        cycle_name = row["cycle_name"]
        cycle_id = cycle_map.get(cycle_name)
        if not cycle_id:
            print(f"  ⚠ 行 {i}: cycle '{cycle_name}' 未找到，跳过")
            continue
        module_name = row.get("module_name", "")
        issues_data.append({
            "name": row["name"],
            "description_html": row.get("description_html", "") or "",
            "type_id": row["type_id"],
            "state_id": row["state_id"],
            "assignees": json.loads(row["assignees"]),
            "extra_properties": json.loads(row["extra_properties"]),
            "cycle_id": cycle_id,
            "cycle_name": cycle_name,
            "module_id": module_map.get(module_name, "") if module_name else "",
        })

    import base64
    issues_b64 = base64.b64encode(json.dumps(issues_data, ensure_ascii=False).encode()).decode()
    closed_cycles_json = json.dumps(list(CLOSED_CYCLES), ensure_ascii=False)

    script = textwrap.dedent(f"""
import json, base64
from plane.db.models import (
    Issue, IssueAssignee, CycleIssue, ModuleIssue,
    Project, ProjectMember, State, Workspace
)

ws = Workspace.objects.get(slug='{ws}')
proj = Project.objects.get(id='{project_id}')
user = ProjectMember.objects.filter(project=proj).order_by('created_at').first().member

closed_state = State.objects.filter(project=proj, group='completed').first()
if not closed_state:
    raise RuntimeError('未找到 completed group 的 state')
print(f'Done state: {{closed_state.name}} ({{closed_state.id}})')

closed_cycles = set(json.loads('''{closed_cycles_json}'''))
issues_data = json.loads(base64.b64decode('{issues_b64}').decode())

# bulk_create Issues
issue_objs = []
for d in issues_data:
    state_id = str(closed_state.id) if d['cycle_name'] in closed_cycles else d['state_id']
    issue_objs.append(Issue(
        workspace=ws,
        project=proj,
        name=d['name'],
        description_html=d['description_html'],
        type_id=d['type_id'],
        state_id=state_id,
        priority='none',
        extra_properties=d['extra_properties'],
        created_by=user,
        updated_by=user,
    ))

created = Issue.objects.bulk_create(issue_objs)
print(f'✅ 创建 Issue: {{len(created)}} 条')

# 直接用 zip 保持顺序（PostgreSQL bulk_create 保证返回顺序与输入一致）
pairs = list(zip(created, issues_data))

# bulk_create IssueAssignee
assignee_objs = []
for issue, d in pairs:
    for uid in d['assignees']:
        assignee_objs.append(IssueAssignee(
            workspace=ws, project=proj, issue_id=str(issue.id), assignee_id=uid,
            created_by=user, updated_by=user,
        ))
if assignee_objs:
    IssueAssignee.objects.bulk_create(assignee_objs, ignore_conflicts=True)
    print(f'✅ 关联 Assignee: {{len(assignee_objs)}} 条')

# bulk_create CycleIssue
from collections import defaultdict
cycle_groups = defaultdict(list)
module_groups = defaultdict(list)
for issue, d in pairs:
    cycle_groups[d['cycle_id']].append(str(issue.id))
    if d['module_id']:
        module_groups[d['module_id']].append(str(issue.id))

from plane.db.models import Cycle
cycle_objs = []
for cycle_id, issue_ids in cycle_groups.items():
    cycle = Cycle.objects.get(id=cycle_id)
    existing = set(str(x) for x in CycleIssue.objects.filter(cycle=cycle).values_list('issue_id', flat=True))
    for iid in issue_ids:
        if iid not in existing:
            cycle_objs.append(CycleIssue(
                workspace=ws, project=proj, cycle=cycle, issue_id=iid,
                created_by=user, updated_by=user,
            ))
CycleIssue.objects.bulk_create(cycle_objs, ignore_conflicts=True)
print(f'✅ 关联 CycleIssue: {{len(cycle_objs)}} 条')

# 打印各 Cycle 分布
from plane.db.models import Cycle as CycleModel
for cycle_id, issue_ids in cycle_groups.items():
    cname = CycleModel.objects.get(id=cycle_id).name
    print(f'  {{cname}}: {{len(issue_ids)}} 条')

# bulk_create ModuleIssue
from plane.db.models import Module
module_objs = []
for module_id, issue_ids in module_groups.items():
    module = Module.objects.get(id=module_id)
    for iid in issue_ids:
        module_objs.append(ModuleIssue(
            workspace=ws, project=proj, module=module, issue_id=iid,
            created_by=user, updated_by=user,
        ))
ModuleIssue.objects.bulk_create(module_objs, ignore_conflicts=True)
print(f'✅ 关联 ModuleIssue: {{len(module_objs)}} 条')

print(f'RESULT:{{len(created)}}:0')
""")
    out = run_django_shell(cfg["container"], script)
    print(out.strip())

    # 解析结果
    for line in out.splitlines():
        if line.startswith("RESULT:"):
            ok, fail = line[7:].split(":")
            break
    else:
        ok, fail = "?", "?"

    print("\n" + "─" * 50)
    print("📊 导入报告")
    print(f"  总处理: {len(issues_data)} 行  ✅成功: {ok}  ✗失败: {fail}")
    print("─" * 50)


# ── 入口 ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="重新导入 Requirement 数据到 Plane")
    parser.add_argument("--env", choices=["dev", "prod"], default="dev",
                        help="目标环境（dev|prod）")
    parser.add_argument("--clean", action="store_true",
                        help="导入前先清空所有 Requirement issues")
    args = parser.parse_args()

    cfg = ENV_CONFIG[args.env]
    print(f"环境: {args.env}  容器: {cfg['container']}  项目: {cfg['project_id']}")

    if args.clean:
        clean_requirements(cfg)

    cycle_map = ensure_cycles(cfg)
    module_map = ensure_modules(cfg)
    import_issues(cfg, cycle_map, module_map)


if __name__ == "__main__":
    main()
