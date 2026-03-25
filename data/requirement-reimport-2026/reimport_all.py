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
# 工号 → email（环境无关，用于 Module Assignee 查找）
EMP_ID_EMAIL: dict[str, str] = {
    "025246": "zhuhongfei@htsc.com",
    "025241": "wangshengpeng@htsc.com",
    "024868": "qiangaoxiang@htsc.com",
    "023824": "liupeijin@htsc.com",
    "019040": "xiaqing@htsc.com",
    "017573": "yaozhongbing@htsc.com",
    "019521": "zenghuicong@htsc.com",
    "015260": "sunyuhan@htsc.com",
    "010713": "zhang.jun@htsc.com",
    "017436": "qiting@htsc.com",
    "017433": "wanglunzhang@htsc.com",
    "017485": "wangxifeng@htsc.com",
    "015964": "xuke015964@htsc.com",
    "018045": "chenzhiping@htsc.com",
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


# ── Extra Property 定义（从 Dev 环境导出，生产环境幂等创建）────────────────────
EXTRA_PROPERTIES = [
  {"key":"techLead","label":"IT技术负责人","type":"member","config":{"member_color":"#3b82f6"},"is_required":False},
  {"key":"refs","label":"参考链接","type":"reference","config":{},"is_required":False},
  {"key":"department","label":"所属部门","type":"select","config":{"options":[{"label":"中央交易室","value":"中央交易室"},{"label":"信息技术部","value":"信息技术部"},{"label":"固定收益部","value":"固定收益部"},{"label":"资金运营部","value":"资金运营部"},{"label":"风险管理部","value":"风险管理部"},{"label":"香港金控FICC","value":"香港金控FICC"}]},"is_required":False},
  {"key":"domestic_overseas","label":"境内/外类别","type":"select","config":{"options":[{"label":"境内","value":"境内"},{"label":"境外","value":"境外"}]},"is_required":False},
  {"key":"category_l1","label":"一级分类","type":"select","config":{"options":[{"label":"互换","value":"互换"},{"label":"借贷","value":"借贷"},{"label":"债券","value":"债券"},{"label":"回购","value":"回购"},{"label":"场外衍生品","value":"场外衍生品"},{"label":"基金","value":"基金"},{"label":"外汇","value":"外汇"},{"label":"拆借","value":"拆借"},{"label":"期权","value":"期权"},{"label":"期货","value":"期货"},{"label":"票据","value":"票据"},{"label":"综合","value":"综合"}]},"is_required":False},
  {"key":"category_l2","label":"二级分类","type":"select","config":{"options":[{"label":"TARF","value":"TARF"},{"label":"债券ETF","value":"债券ETF"},{"label":"南向通债券","value":"南向通债券"},{"label":"商品期权","value":"商品期权"},{"label":"场外收益互换","value":"场外收益互换"},{"label":"外币回购","value":"外币回购"},{"label":"外币拆借","value":"外币拆借"},{"label":"外汇期货","value":"外汇期货"},{"label":"多资产","value":"多资产"},{"label":"平台优化","value":"平台优化"},{"label":"票据","value":"票据"},{"label":"美国国债","value":"美国国债"},{"label":"股指期货","value":"股指期货"},{"label":"转贴现和正回购","value":"转贴现和正回购"},{"label":"银行间借贷","value":"银行间借贷"},{"label":"销售业务","value":"销售业务"},{"label":"风险管理","value":"风险管理"},{"label":"债券","value":"债券"},{"label":"债券借贷","value":"债券借贷"},{"label":"国债期货","value":"国债期货"}]},"is_required":False},
  {"key":"category_l3","label":"三级分类","type":"select","config":{"options":[{"label":"业务报表","value":"业务报表"},{"label":"交易后","value":"交易后"},{"label":"交易管理","value":"交易管理"},{"label":"交易簿记","value":"交易簿记"},{"label":"交易链路","value":"交易链路"},{"label":"交易风控","value":"交易风控"},{"label":"信用风险","value":"信用风险"},{"label":"场外","value":"场外"},{"label":"策略研发","value":"策略研发"},{"label":"账户管理","value":"账户管理"},{"label":"销售管理","value":"销售管理"},{"label":"风险管理","value":"风险管理"},{"label":"做市义务监控","value":"做市义务监控"},{"label":"客户准入","value":"客户准入"}]},"is_required":False},
  {"key":"center","label":"所属中心","type":"select","config":{"options":[{"label":"FICC交易平台中心","value":"FICC交易平台中心"},{"label":"代客业务中心","value":"代客业务中心"},{"label":"做市业务中心","value":"做市业务中心"},{"label":"流动性管理中心","value":"流动性管理中心"},{"label":"科技研发中心","value":"科技研发中心"},{"label":"自营业务中心","value":"自营业务中心"},{"label":"销售业务中心","value":"销售业务中心"},{"label":"风险合规中心","value":"风险合规中心"}]},"is_required":False},
  {"key":"team","label":"所属团队","type":"select","config":{"options":[{"label":"—","value":"—"},{"label":"代客销售团队","value":"代客销售团队"},{"label":"信用交易台","value":"信用交易台"},{"label":"利率衍生品交易台","value":"利率衍生品交易台"},{"label":"外币债券做市台","value":"外币债券做市台"},{"label":"外汇产品团队","value":"外汇产品团队"},{"label":"外汇做市台","value":"外汇做市台"},{"label":"大象平台产品团队","value":"大象平台产品团队"},{"label":"宏观产品团队","value":"宏观产品团队"},{"label":"平台架构","value":"平台架构"},{"label":"策略管理","value":"策略管理"},{"label":"自营交易七台","value":"自营交易七台"},{"label":"自营交易五台","value":"自营交易五台"},{"label":"量化研发团队","value":"量化研发团队"},{"label":"风险管理团队","value":"风险管理团队"},{"label":"多资产创新产品团队","value":"多资产创新产品团队"},{"label":"本币做市台","value":"本币做市台"},{"label":"融资台","value":"融资台"}]},"is_required":False},
  {"key":"biz_pm","label":"固收产品经理","type":"text","config":{},"is_required":False},
  {"key":"biz_priority","label":"业务优先级","type":"text","config":{},"is_required":False},
  {"key":"it_pm","label":"IT产品经理","type":"member","config":{"member_color":"#10b981"},"is_required":False},
  {"key":"in_delivery","label":"是否纳入交付","type":"checkbox","config":{},"is_required":False},
  {"key":"estimated_iteration","label":"预估迭代","type":"select","config":{"options":[{"label":"本迭代无法启动后续重新排期","value":"本迭代无法启动后续重新排期"},{"label":"预计0425迭代完成交付","value":"预计0425迭代完成交付"},{"label":"预计0523迭代之后完成交付","value":"预计0523迭代之后完成交付"},{"label":"预计0523迭代完成交付","value":"预计0523迭代完成交付"},{"label":"预计0613迭代之后完成交付","value":"预计0613迭代之后完成交付"},{"label":"预计0613迭代完成交付","value":"预计0613迭代完成交付"},{"label":"预计0704迭代完成交付","value":"预计0704迭代完成交付"},{"label":"预计0704迭代之后完成交付","value":"预计0704迭代之后完成交付"}]},"is_required":False},
  {"key":"delivery_content","label":"交付内容","type":"text","config":{},"is_required":False},
  {"key":"remarks","label":"备注","type":"text","config":{},"is_required":False},
  {"key":"admission","label":"需求是否准入","type":"checkbox","config":{},"is_required":False},
  {"key":"req_source","label":"需求编号","type":"text","config":{},"is_required":False},
]


# ── Step 0: 确保 Extra Property 定义存在（幂等）────────────────────────────────

def ensure_extra_properties(cfg: dict):
    print("\n[Step 0] 确保 Extra Property 定义存在 ...")
    import base64
    ep_b64 = base64.b64encode(json.dumps(EXTRA_PROPERTIES, ensure_ascii=False).encode()).decode()
    script = textwrap.dedent(f"""
import json, base64
from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty, IssueType, Project, Workspace

ws = Workspace.objects.get(slug='{cfg["workspace"]}')
proj = Project.objects.get(id='{cfg["project_id"]}')
req_type = IssueType.objects.filter(workspace=ws, name='Requirement').first()
if not req_type:
    print('❌ 未找到 Requirement IssueType，请先创建')
    exit(1)

ep_defs = json.loads(base64.b64decode('{ep_b64}').decode())
created = skipped = 0
for d in ep_defs:
    config, _ = ExtraPropertyConfig.objects.get_or_create(
        workspace=ws, key=d['key'],
        defaults={{'label': d['label'], 'type': d['type'], 'config': d['config']}}
    )
    _, new = IssueTypeExtraProperty.objects.get_or_create(
        project=proj, issue_type=req_type, extra_property_config=config,
        defaults={{'is_required': d['is_required']}}
    )
    if new:
        created += 1
    else:
        skipped += 1

print(f'✅ Extra Properties: 新建 {{created}} 个，已存在跳过 {{skipped}} 个')
""")
    out = run_django_shell(cfg["container"], script)
    print(out.strip())





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

    modules_csv = os.path.join(DIR, "source", "Jira modules.csv")
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
                    "lead_email": EMP_ID_EMAIL.get(assignee_emp, ""),
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
    if m['lead_email']:
        lead = User.objects.filter(email=m['lead_email']).first()
        if not lead:
            print(f'  ⚠ lead email 未找到: {{m["lead_email"]}}')

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
    # Dev uuid→email 映射（用于生产环境替换）
    dev_uuid_email = {
        "b0c16d7f-e6db-46ed-b34e-ff2059b1c211": "zhuhongfei@htsc.com", "e7b11737-6f57-458f-9892-5a168e411edf": "wangshengpeng@htsc.com", "535b3838-1804-4a1f-8353-5320babd97b8": "qiangaoxiang@htsc.com", "daa28f62-9d59-4c8a-9c93-28d931e72b99": "liupeijin@htsc.com", "9a969130-2666-4604-9326-c2b17ca09ef1": "xiaqing@htsc.com", "74c21a3b-1b9b-47f2-b7ab-b8195738260d": "yaozhongbing@htsc.com", "86316c00-0847-43a8-8176-834f264e0307": "zenghuicong@htsc.com", "15e4d327-6119-4941-85ac-624f7b021630": "jiangyuzhu@htsc.com", "6fe8459b-3b6b-4197-a29a-f95f2a7e20cc": "chengnan@htsc.com", "b5cf400d-4a1a-4daf-8ad7-dc33d720391c": "bichenggong@htsc.com", "98cb9446-ac30-4857-9c77-644999e62d52": "wanglunzhang@htsc.com", "ee31178b-09ee-4d85-a3dd-7302c10c3af5": "wangxifeng@htsc.com", "0d5d1a69-68ee-4885-9bb7-bf93e92eb4aa": "qiting@htsc.com", "943c1313-5035-46a0-b1e2-91e3a19546a6": "wukeyiqiong@htsc.com", "f81bb5d7-a37c-4d34-b1fc-f92d46f5b2a8": "zhangtianyi@htsc.com", "144bf735-9e10-4029-84d0-85e3749bf5d3": "zhangxian012191@htsc.com", "ee12bda6-18fc-4ad5-a35e-74c256781157": "zhang.jun@htsc.com", "77342d2f-a6cf-4a2d-8142-2f5f84d0636a": "chenzhiping@htsc.com", "14b265fe-200d-46aa-8e25-66f57a1e130d": "xuke015964@htsc.com", "8baed4ad-64c0-4922-b4bb-e9d77a865fd7": "sunyuhan@htsc.com", "1f032804-4e24-4b85-a5d3-e57bb39f84b4": "huyufan@htsc.com", "6c2cb768-b63a-45b0-859e-859ab2345c4e": "xiaqingfei@htsc.com",
    }
    dev_uuid_email_b64 = base64.b64encode(json.dumps(dev_uuid_email, ensure_ascii=False).encode()).decode()

    # member 类型的 extra_property key（需要替换 UUID）
    MEMBER_EP_KEYS = ["techLead", "it_pm"]

    script = textwrap.dedent(f"""
import json, base64
from django.db import transaction
from plane.db.models import (
    Issue, IssueAssignee, CycleIssue, ModuleIssue,
    IssueType, Project, ProjectMember, State, User, Workspace
)

ws = Workspace.objects.get(slug='{ws}')
proj = Project.objects.get(id='{project_id}')
user = ProjectMember.objects.filter(project=proj).order_by('created_at').first().member

# 运行时查询 type_id 和 state（不依赖 CSV 中的 Dev UUID）
req_type = IssueType.objects.filter(workspace=ws, name='Requirement').first()
if not req_type:
    raise RuntimeError('未找到 Requirement IssueType')
closed_state = State.objects.filter(project=proj, group='completed').first()
backlog_state = State.objects.filter(project=proj, group='backlog').first()
if not closed_state or not backlog_state:
    raise RuntimeError('未找到 completed/backlog state')
print(f'type_id: {{req_type.id}}')
print(f'Done state: {{closed_state.id}}, Backlog state: {{backlog_state.id}}')

# 建立 email→uuid 映射（用于替换 CSV 中的 Dev UUID）
dev_uuid_email = json.loads(base64.b64decode('{dev_uuid_email_b64}').decode())
email_to_uuid = {{m.member.email: str(m.member.id)
                  for m in ProjectMember.objects.filter(project=proj).select_related('member')
                  if m.member.email}}
# dev_uuid → prod_uuid
uuid_remap = {{}}
for dev_uuid, email in dev_uuid_email.items():
    prod_uuid = email_to_uuid.get(email)
    if prod_uuid:
        uuid_remap[dev_uuid] = prod_uuid
print(f'UUID 映射: {{len(uuid_remap)}} 个用户')

member_ep_keys = {json.dumps(MEMBER_EP_KEYS)}

def remap_uuid(uid):
    return uuid_remap.get(uid, uid)

closed_cycles = set(json.loads('''{closed_cycles_json}'''))
issues_data = json.loads(base64.b64decode('{issues_b64}').decode())

with transaction.atomic():
    issue_objs = []
    remapped_data = []
    for d in issues_data:
        state_id = str(closed_state.id) if d['cycle_name'] in closed_cycles else str(backlog_state.id)
        # 替换 assignees UUID
        new_assignees = [remap_uuid(uid) for uid in d['assignees']]
        # 替换 extra_properties 中 member 类型字段的 UUID
        ep = dict(d['extra_properties'])
        for key in member_ep_keys:
            if key in ep and ep[key]:
                ep[key] = remap_uuid(ep[key])
        issue_objs.append(Issue(
            workspace=ws, project=proj,
            name=d['name'], description_html=d['description_html'],
            type_id=str(req_type.id), state_id=state_id,
            priority='none', extra_properties=ep,
            created_by=user, updated_by=user,
        ))
        remapped_data.append({{**d, 'assignees': new_assignees}})

    created = Issue.objects.bulk_create(issue_objs)
    print(f'✅ 创建 Issue: {{len(created)}} 条')

    # 修复 sequence_id：bulk_create 绕过 save()，需手动分配唯一序号并创建 IssueSequence
    from plane.db.models import IssueSequence
    from django.db.models import Max
    last_seq = IssueSequence.objects.filter(project=proj).aggregate(m=Max('sequence'))['m'] or 0
    seq_objs = []
    for idx, issue in enumerate(created, 1):
        issue.sequence_id = last_seq + idx
        seq_objs.append(IssueSequence(issue=issue, sequence=issue.sequence_id, project=proj, workspace=ws))
    Issue.objects.bulk_update(created, ['sequence_id'])
    IssueSequence.objects.bulk_create(seq_objs, ignore_conflicts=True)
    print(f'✅ 分配 sequence_id: {{last_seq+1}} ~ {{last_seq+len(created)}}')

    pairs = list(zip(created, remapped_data))

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

    ensure_extra_properties(cfg)
    cycle_map = ensure_cycles(cfg)
    module_map = ensure_modules(cfg)
    import_issues(cfg, cycle_map, module_map)


if __name__ == "__main__":
    main()
