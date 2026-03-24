---
name: plane-migrate
description: FICC 专用 Jira → Plane 迁移助手。分析 Jira CSV/XLSX、对比 work item type 现有字段、建议并创建缺失 extra properties、生成 import_ready CSV、完成导入。
license: MIT
metadata:
  author: ficc-local
  version: "1.3"
---

# Plane 迁移助手（FICC 专用）

## 调用形式

```
/plane-migrate <文件名> <work_item_type名称> [cycle名称]
```

示例：

- `/plane-migrate Requirement.csv Req`
- `/plane-migrate Story.csv Story 大象-常规-26-0328`
- `/plane-migrate 26-0425迭代需求.xlsx Requirement`
- 文件默认在 `/opt/code/plane/jira_data/` 目录下，支持 `.csv` 和 `.xlsx`。

---

## FICC 固定配置

在整个 skill 执行过程中使用以下常量，不要询问用户：

```
BASE_URL    = http://localhost:8000
API_TOKEN   = plane_api_7ad39eb392a542f59bcc59e8fcb92b9d
WORKSPACE   = ficc
PROJECT_ID  = 18b7ccc8-4b96-4af0-8c6f-76550cba28a7
JIRA_DIR    = /opt/code/plane/jira_data/
DOCKER_API  = plane-api-1
```

REST API 调用使用 Header：`X-Api-Key: <API_TOKEN>`

---

## 两类操作的执行方式

**方式 A：REST API（`/api/v1/` 前缀，支持 X-Api-Key 认证）**
适用于：workspace members、project states、issues 的 CRUD

**方式 B：Django Shell（部分端点 session auth 的替代，以及 REST 不支持的操作）**
适用于：issue-types 查询、extra-property-configs 创建、extra-property 绑定、**Cycle 和 Module 创建**

```bash
# Django Shell 模板
docker exec -i plane-api-1 python manage.py shell << 'EOF'
from plane.db.models import ...
...
EOF
```

> ⚠️ 使用 `docker exec -i ... << 'EOF'` 的 heredoc 形式，避免 `-c` 参数在多行脚本中的引号转义问题。

---

## 文件读取：CSV 与 XLSX 统一处理

读取前先判断扩展名：

```python
import os
filepath = '/opt/code/plane/jira_data/<filename>'
ext = os.path.splitext(filepath)[1].lower()

if ext == '.csv':
    # 自动检测分隔符（Jira 导出常用分号）
    import csv
    with open(filepath, encoding='utf-8') as f:
        sample = f.read(2048); f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=',;')
        reader = csv.DictReader(f, dialect=dialect)
        rows = list(reader)
    headers = rows[0].keys() if rows else []

elif ext in ('.xlsx', '.xls'):
    # openpyxl DataValidation 兼容补丁（必须在 import openpyxl 之前执行）
    import openpyxl.worksheet.datavalidation as dv
    _orig = dv.DataValidation.__init__
    def _patched(self, *a, **kw): kw.pop('id', None); _orig(self, *a, **kw)
    dv.DataValidation.__init__ = _patched

    import openpyxl
    wb = openpyxl.load_workbook(filepath, data_only=True)
    # 默认使用第一个 sheet，或让用户指定
    ws = wb.active
    all_rows = list(ws.iter_rows(values_only=True))
    headers = all_rows[0]
    rows = [
        {str(headers[i]): row[i] for i in range(len(headers)) if headers[i] is not None}
        for row in all_rows[1:]
        if any(v is not None for v in row)
    ]
```

> xlsx 文件若有多个 Sheet，在 GAP REPORT 中告知用户并询问使用哪个。

---

## 标准 Jira → Plane 字段映射表（内嵌，无需推断）

| Jira CSV 列                | Plane API 字段                | 说明                                         |
| -------------------------- | ----------------------------- | -------------------------------------------- |
| `summary` / `需求名`       | `name`                        | 直接映射，最多255字符                        |
| `description` / `需求描述` | `description_html`            | pandoc 转换 wiki markup → HTML（见下方规则） |
| `assignee`                 | `assignees`                   | display_name 精确匹配 workspace members      |
| `status`                   | `state`                       | 模糊匹配 project states（见下方规则）        |
| `sprint` / `sprint.0`      | `cycle`                       | 同名精确匹配；未提供则不关联                 |
| `key` / `需求编号`         | `extra_properties.req_source` | 写入 req_source EP，仅作溯源标签，不唯一     |
| `issuetype`                | `type_id`                     | 由 work_item_type 参数确定                   |
| _(固定)_                   | `priority`                    | 固定值 `"none"`                              |
| _(固定)_                   | `state`                       | 若 status 列不存在，用项目默认 state         |

**以上列以外的所有其他列** = 候选 extra properties 或 Module 关联，进入 Phase 2 分析。

---

## Extra Property 类型推断规则

对每个"其他列"，分析列的样本值后给出建议类型和理由：

| 条件（优先级从高到低）                        | 建议类型      |
| --------------------------------------------- | ------------- |
| 值与 Plane 成员 display_name 高度重叠（>50%） | `member`      |
| 唯一值 ≤ 15 且单值长度 < 30                   | `select`      |
| 值域是布尔/是否/Yes/No                        | `checkbox`    |
| 含 http:// 或 https://                        | `text`（URL） |
| 平均长度 > 100                                | `textarea`    |
| 其余                                          | `text`        |

**member 类型判定逻辑**：

```python
# 用 Phase 1d 建立的全量成员 display_name 集合做匹配
member_names = set(m['display_name'] for m in all_members)
col_vals = [v for v in column_values if v]
match_rate = sum(1 for v in col_vals if v in member_names) / len(col_vals)
if match_rate > 0.5:
    suggested_type = 'member'
```

---

## State（Jira status → Plane state）模糊匹配规则

查询 project states 后，用以下顺序尝试匹配：

1. 完全相同（忽略大小写）
2. Plane state name 包含 Jira status 值（或反之）
3. 常见映射：`待办/To Do → Backlog 或 Todo`，`处理中/In Progress → In Progress`，`完成/Done → Done`，`关闭/Closed → Cancelled`
4. 仍无匹配 → 在 GAP REPORT 中显示，要求用户指定

---

## 五阶段工作流

### Phase 1：INSPECT（自动执行，不等用户确认）

**1a. 解析文件（CSV 或 XLSX）**

按上方"文件读取"章节处理，分析每列：

- 列名、非空率、唯一值数量、最大/平均长度、前5个样本值

**1b. 解析 work_item_type 参数**

```python
from plane.db.models import IssueType, Workspace
ws = Workspace.objects.get(slug='ficc')
types = IssueType.objects.filter(workspace=ws).values('id', 'name')
```

- 尝试精确匹配（忽略大小写）
- 若无精确匹配，列出所有可用类型，询问用户选择哪个
- 找到后记录 `ISSUE_TYPE_ID`

**1c. 查询该 work item type 已有的 extra properties**

```python
from plane.db.models import IssueTypeExtraProperty, Project
project = Project.objects.get(id='PROJECT_ID')
bindings = IssueTypeExtraProperty.objects.filter(
    project=project, issue_type_id='ISSUE_TYPE_ID'
).select_related('extra_property_config')
```

**1d. 查询辅助数据（REST API）**

```bash
# Workspace members（全量，用于 assignee 匹配 AND member-type EP 推断）
GET /api/v1/workspaces/ficc/members/
# 返回 list，每项含 id, display_name, email
# ★ 建立完整映射：display_name_map = {m['display_name']: m['id'] for m in members}

# Project states（用于 status 匹配）
GET /api/v1/workspaces/ficc/projects/<PROJECT_ID>/states/

# 当前 cycles（用于 sprint 匹配）
GET /api/v1/workspaces/ficc/projects/<PROJECT_ID>/cycles/?per_page=50

# 当前 modules（用于 module 列匹配）
GET /api/v1/workspaces/ficc/projects/<PROJECT_ID>/modules/?per_page=100
# ★ 建立映射：module_name_map = {m['name']: m['id'] for m in modules}
```

---

### Phase 2：GAP REPORT（展示给用户确认）

输出一份完整报告，格式如下：

```
═══ INSPECT 结果 ═══

文件：Requirement.xlsx（Sheet: 需求列表），共 XX 行
Work Item Type：Requirement（已匹配）

【已映射的标准字段】
  需求名         → name          ✅
  需求描述       → description_html ✅
  assignee       → assignees     ✅ (XX个用户全部匹配 / ⚠️ N个未匹配: xxx)
  status         → state         ✅ (映射: 待办→Backlog, 处理中→In Progress, ...)
                                 ⚠️ 未匹配: "已审核" → ? (需用户指定)
  sprint.0       → cycle         ✅ (大象-常规-26-0328 已存在)
                                 ⚠️ "大象-常规-25-xxxx" 不存在，是否创建？

【已有的 extra properties（无需操作）】
  techLead (member)
  refs (reference)
  ...

【候选 Module 关联列（不建议创建 extra property）】
  重点项目标签  →  值与现有 Module 名称匹配率 83%，建议：改用 Module 关联
                   匹配: O45迁移项目、FICC策略平台整合项目...
                   ⚠️ 未匹配的值: "无"（35条，不关联 module）

【需要新建的 extra properties（候选）】
  列名            建议key       建议类型    理由              样本值
  ──────────────────────────────────────────────────────────────
  IT产品经理      it_pm         member    67%匹配Plane成员    夏清, 钱高翔
  所属部门        department    select    6种唯一值           固定收益部, 信息技术部
  是否纳入交付    in_delivery   checkbox  是/否布尔值         是, 否
  ...

【无法映射/建议忽略的列】
  issuetype       → 已用于确定 type_id，导入时不写入
  需求提出人      → 全空，跳过
  需求是否准入    → 唯一值仅"是"，无区分价值，建议忽略

⚠️ 请确认以上方案，或指出需要修改的部分：
   1. 确认新建 extra properties（可修改类型/key/是否必填）
   2. 是否处理 Module 关联列
   3. 指定未匹配的 status 映射
   4. 决定缺失 cycle 的处理方式（自动创建 / 不关联）
```

**等待用户确认后**，记录用户的修改意见，继续 Phase 3。

---

### Phase 3：CONFIG（创建 extra properties + Cycle + 绑定）

**仅在用户确认后执行。**

**3a. 创建 ExtraPropertyConfig**（Django Shell）

```python
from plane.db.models import ExtraPropertyConfig, IssueTypeExtraProperty, IssueType, Project, Workspace
ws = Workspace.objects.get(slug='ficc')
project = Project.objects.get(id='<PROJECT_ID>')
issue_type = IssueType.objects.get(workspace=ws, name='<TYPE_NAME>')

# select 类型
config = ExtraPropertyConfig.objects.create(
    workspace=ws, key='<key>', label='<label>', type='select',
    config={"options": [{"value": "高", "label": "高"}, ...]}
)
# member 类型
config = ExtraPropertyConfig.objects.create(
    workspace=ws, key='<key>', label='<label>', type='member',
    config={"member_color": "#3b82f6"}
)
# text / checkbox 类型（config 为空 dict）
config = ExtraPropertyConfig.objects.create(
    workspace=ws, key='<key>', label='<label>', type='text', config={}
)

IssueTypeExtraProperty.objects.create(
    project=project, issue_type=issue_type,
    extra_property_config=config, is_required=False,
)
print(f'Created & bound: {config.key} ({config.type})')
```

**3b. 创建缺失的 Cycle**（⚠️ 必须用 Django Shell，REST API 不可靠）

```python
# REST API POST /cycles/ 会报 "Project ID is required"，改用 Django Shell
from plane.db.models import Cycle, Project, ProjectMember
project = Project.objects.get(id='<PROJECT_ID>')
ws = project.workspace
user = ProjectMember.objects.filter(project=project).first().member

cycle = Cycle.objects.create(
    workspace=ws,
    project=project,
    name='<cycle名称>',
    start_date='<YYYY-MM-DDT00:00:01+08:00>',  # 带时区，避免 naive datetime 警告
    end_date='<YYYY-MM-DDT23:59:00+08:00>',
    owned_by=user,   # ★ 必填，否则 IntegrityError
    created_by=user,
    updated_by=user,
)
print(f'cycle_id: {cycle.id}')
```

**3c. 创建缺失的 Module**（Django Shell）

```python
from plane.db.models import Module, Project, ProjectMember
project = Project.objects.get(id='<PROJECT_ID>')
ws = project.workspace
user = ProjectMember.objects.filter(project=project).first().member

module = Module.objects.create(
    workspace=ws,
    project=project,
    name='<module名称>',
    status='backlog',
    external_source='jira',
    external_id='<JIRA-KEY>',
    created_by=user,
    updated_by=user,
)
print(f'module_id: {module.id}')
```

完成后输出：`✅ 创建了 N 个 extra properties，Cycle X，Module Y`

---

### Phase 4：TRANSFORM（生成 import_ready CSV）

生成 `jira_data/<basename>_import_ready.csv`，列包含：

```
name, description_html, type_id, state_id, priority,
assignees(JSON), extra_properties(JSON), cycle_id, module_id
```

转换规则：

- `assignees` = `json.dumps([uid])` 或 `json.dumps([])`（未匹配时）
- `extra_properties` = `json.dumps({...})`（仅包含非空字段）
  - **req_source**：需求编号列的值直接写入（字符串），为空时不写入该键
  - **member 类型字段**：用 Phase 1d 建立的 `display_name_map` 完整查询，填入 UUID；未匹配时留空并在 GAP REPORT 中列出
  - **checkbox 类型字段**："是"/True → `true`，"否"/False → `false`
- `cycle_id` = Cycle UUID（全部行填同一个，或从 sprint 列匹配）
- `module_id` = Module UUID（从 Module 关联列精确匹配名称；"无"/空 → 空字符串）
- `state_id`：用匹配到的 Plane state UUID
- `description_html`：**使用 pandoc 将 Jira wiki markup 转换为 HTML**（见下方转换规则）

**展示前 3 行预览**，等待用户确认后继续。

---

### description_html 转换规则（Jira Wiki Markup → HTML）

描述字段统一通过 `pandoc -f jira -t html` 转换，**不要**手动拼接 `<p>` 标签。

```python
import subprocess

def wiki_to_html(text):
    """Convert Jira wiki markup to HTML via pandoc. Falls back to <p> wrapping if pandoc fails."""
    if not text or not text.strip():
        return '<p></p>'
    result = subprocess.run(
        ['pandoc', '-f', 'jira', '-t', 'html'],
        input=text, capture_output=True, text=True, timeout=10
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    # fallback: plain <p> per line
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return ''.join(f'<p>{l}</p>' for l in lines)
```

pandoc 支持的 Jira wiki markup 转换示例：

| Jira 语法         | 转换结果                      |
| ----------------- | ----------------------------- |
| `h4. 标题`        | `<h4>标题</h4>`               |
| `*加粗*`          | `<strong>加粗</strong>`       |
| `_斜体_`          | `<em>斜体</em>`               |
| ` * 列表项`       | `<ul><li>列表项</li></ul>`    |
| `# 有序项`        | `<ol><li>有序项</li></ol>`    |
| `{code}...{code}` | `<pre><code>...</code></pre>` |
| 普通段落          | `<p>...</p>`                  |

> **注意**：pandoc 不在宿主机 Docker 容器内，须在**宿主机**运行 Python 脚本调用 pandoc，再将结果写入 import_ready CSV，然后在 Phase 5 读取 CSV 导入。

---

### Phase 5：IMPORT（执行导入）

读取 import_ready CSV，逐行 POST（间隔 0.3s 防限流）：

```python
payload = {
    "name": row['name'],
    "description_html": row['description_html'],
    "type_id": row['type_id'],
    "state": row['state_id'],      # 字段名为 state（传 UUID）
    "priority": "none",
    "assignees": json.loads(row['assignees']),
    "extra_properties": json.loads(row['extra_properties']),
    # ★ 不传 external_id / external_source：需求编号已写入 extra_properties.req_source
}
```

> ⚠️ 每次导入**均新建** issue，不检查重复。相同 req_source 值在不同 cycle 中多次导入是合法的。

成功后收集 issue UUID，最后**批量**关联 Cycle 和 Module：

```python
# Cycle 批量关联（一次调用传所有 issue_ids）
POST /api/v1/workspaces/ficc/projects/<PROJECT_ID>/cycles/<cycle_id>/cycle-issues/
{"issues": [<all_issue_ids>]}

# Module 按 module_id 分组关联
for module_id, issue_ids in module_groups.items():
    POST /api/v1/workspaces/ficc/projects/<PROJECT_ID>/modules/<module_id>/module-issues/
    {"issues": issue_ids}
```

**最终汇总**：

```
成功: XX  失败: XX
失败列表: [...]

Cycle 关联: XX 条
Module 关联: X 个 module，共 XX 条 issue
```

---

## 注意事项

- **限流保护**：REST API 调用之间 sleep 0.3s，批量操作若触发 429 则 sleep 5s 后重试一次
- **name 截断**：超过 255 字符的 summary 截断并在 GAP REPORT 中提示
- **空 assignee**：未匹配到 Plane 用户的 assignee 在 GAP REPORT 中列出，导入时 assignees=[]
- **member EP 匹配**：在 Phase 1d 建立全量 `display_name → UUID` 映射后，TRANSFORM 阶段所有 member 类型字段都用此映射查找，**不要硬编码只查少数名字**
- **sprint.1**：若 CSV 有多个 sprint 列，只处理 sprint.0 作为主 cycle 关联
- **import_ready CSV 复用**：如用户说"直接导入"且 import_ready 文件已存在，跳过 Phase 1-4
- **openpyxl DataValidation 兼容性**：较新版本 xlsx 文件（含数据验证 `id` 属性）需在 import openpyxl 前打上 monkey-patch，否则 `load_workbook` 会抛 `TypeError: DataValidation.__init__() got an unexpected keyword argument 'id'`

---

## 已知 API 限制（勿踩坑）

| 操作         | 正确方式                               | 错误方式                                            |
| ------------ | -------------------------------------- | --------------------------------------------------- |
| 创建 Cycle   | Django Shell（需 `owned_by` 字段）     | REST POST /cycles/（返回 "Project ID is required"） |
| 创建 Module  | Django Shell                           | REST POST /modules/（同样有问题）                   |
| 查询 members | REST GET /members/                     | —                                                   |
| 创建 issue   | REST POST /issues/                     | —                                                   |
| 关联 Cycle   | REST POST /cycles/{id}/cycle-issues/   | —                                                   |
| 关联 Module  | REST POST /modules/{id}/module-issues/ | —                                                   |
| issue 字段名 | `"state": <UUID>`                      | `"state_id": <UUID>`（无效）                        |
