---
name: plane-migrate
description: FICC 专用 Jira → Plane 迁移助手。分析 Jira CSV、对比 work item type 现有字段、建议并创建缺失 extra properties、生成 import_ready CSV、完成导入。
license: MIT
metadata:
  author: ficc-local
  version: "1.0"
---

# Plane 迁移助手（FICC 专用）

## 调用形式

```
/plane-migrate <csv文件名> <work_item_type名称> [cycle名称]
```

示例：

- `/plane-migrate Requirement.csv Req`
- `/plane-migrate Story.csv Story 大象-常规-26-0328`
- CSV 文件默认在 `/opt/code/plane/jira_data/` 目录下。

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
适用于：workspace members、project states、cycles、issues 的 CRUD

**方式 B：Django Shell（session auth 端点的替代）**
适用于：issue-types 查询、extra-property-configs 创建、extra-property 绑定

```bash
# Django Shell 模板
docker exec plane-api-1 python manage.py shell -c "
from plane.db.models import ...
...
" 2>/dev/null
```

---

## 标准 Jira → Plane 字段映射表（内嵌，无需推断）

| Jira CSV 列           | Plane API 字段     | 说明                                    |
| --------------------- | ------------------ | --------------------------------------- |
| `summary`             | `name`             | 直接映射，最多255字符                   |
| `description`         | `description_html` | 每行包进 `<p>` 标签                     |
| `assignee`            | `assignees`        | display_name 模糊匹配 workspace members |
| `status`              | `state`            | 模糊匹配 project states（见下方规则）   |
| `sprint` / `sprint.0` | `cycle`            | 同名精确匹配；未提供则不关联            |
| `key`                 | `external_id`      | 保留作溯源                              |
| `issuetype`           | `type_id`          | 由 work_item_type 参数确定              |
| _(固定)_              | `external_source`  | 固定值 `"jira"`                         |
| _(固定)_              | `priority`         | 固定值 `"none"`                         |
| _(固定)_              | `state`            | 若 status 列不存在，用项目默认 state    |

**以上列以外的所有其他列** = 候选 extra properties，进入 Phase 2 分析。

---

## Extra Property 类型推断规则

对每个"其他列"，分析列的样本值后给出建议类型和理由，让用户整体确认：

| 条件（优先级从高到低）     | 建议类型      |
| -------------------------- | ------------- |
| 唯一值 ≤ 8 且单值长度 < 20 | `select`      |
| 值域是布尔/是否/Yes/No     | `checkbox`    |
| 含 http:// 或 http://      | `text`（URL） |
| 平均长度 > 100             | `textarea`    |
| 其余                       | `text`        |

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

**1a. 解析 CSV**

```python
# 读取 jira_data/<csv文件名>，分析每列：
# - 列名、非空率、唯一值数量、最大/平均长度、前3个样本值
```

**1b. 解析 work_item_type 参数**

用 Django Shell 获取当前 workspace 的所有 issue types：

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
# Workspace members（用于 assignee 匹配）
GET /api/v1/workspaces/ficc/members/
# 返回 list，每项含 id, display_name, email

# Project states（用于 status 匹配）
GET /api/v1/workspaces/ficc/projects/<PROJECT_ID>/states/

# 当前 cycles（用于 sprint 匹配）
GET /api/v1/workspaces/ficc/projects/<PROJECT_ID>/cycles/
```

---

### Phase 2：GAP REPORT（展示给用户确认）

输出一份完整报告，格式如下：

```
═══ INSPECT 结果 ═══

CSV：Requirement.csv，共 XX 行
Work Item Type：Req（已匹配）

【已映射的标准字段】
  summary        → name          ✅
  description    → description_html ✅
  assignee       → assignees     ✅ (XX个用户全部匹配 / ⚠️ N个未匹配: xxx)
  status         → state         ✅ (映射: 待办→Backlog, 处理中→In Progress, ...)
                                 ⚠️ 未匹配: "已审核" → ? (需用户指定)
  sprint.0       → cycle         ✅ (大象-常规-26-0328 已存在)
                                 ⚠️ "大象-常规-25-xxxx" 不存在，是否创建？

【已有的 extra properties（无需操作）】
  story_type (select, required)
  wiki_url (text)
  ...

【需要新建的 extra properties（候选）】
  列名            建议key       建议类型    理由              样本值
  ──────────────────────────────────────────────────────────────
  priority        priority      select    4种唯一值(高/中/低/无)  高, 中, 低
  acceptance_criteria  acceptance_criteria  textarea  平均长度152字符  "验收条件：..."
  ...

【无法映射/建议忽略的列】
  issuetype       → 已用于确定 type_id，导入时不写入
  sprint.1        → 忽略（只处理 sprint.0）

⚠️ 请确认以上方案，或指出需要修改的部分：
   1. 确认新建 extra properties（可修改类型/key/是否必填）
   2. 指定未匹配的 status 映射
   3. 决定缺失 cycle 的处理方式
```

**等待用户确认后**，记录用户的修改意见，继续 Phase 3。

---

### Phase 3：CONFIG（创建 extra properties + 绑定）

**仅在用户确认后执行。**

**3a. 创建 ExtraPropertyConfig**（Django Shell）

```python
from plane.db.models import ExtraPropertyConfig, Workspace
ws = Workspace.objects.get(slug='ficc')

# 对每个需新建的属性执行：
config = ExtraPropertyConfig.objects.create(
    workspace=ws,
    key='<key>',
    label='<label>',
    type='<text|select|textarea|checkbox>',
    config=<对应的config dict>,  # select时: {"options": [{"value":"xxx","label":"xxx"}, ...]}
)
print(f'Created: {config.id} {config.key}')
```

select 类型的 `config` 结构：

```python
{"options": [{"value": "高", "label": "高"}, {"value": "中", "label": "中"}, ...]}
```

**3b. 绑定到 issue type**（Django Shell）

```python
from plane.db.models import IssueTypeExtraProperty, Project, IssueType
project = Project.objects.get(id='<PROJECT_ID>')
issue_type = IssueType.objects.get(id='<ISSUE_TYPE_ID>')

binding = IssueTypeExtraProperty.objects.create(
    project=project,
    issue_type=issue_type,
    extra_property_config=config,
    is_required=False,  # 除非用户指定
)
print(f'Bound: {binding.id}')
```

**3c. 创建缺失的 cycle**（若用户同意，REST API）

```bash
POST /api/v1/workspaces/ficc/projects/<PROJECT_ID>/cycles/
{"name": "<sprint名>", "status": "draft"}
```

完成后输出：`✅ 创建了 N 个 extra properties，绑定到 Req`

---

### Phase 4：TRANSFORM（生成 import_ready CSV）

生成 `jira_data/<basename>_import_ready.csv`，列包含：

```
external_id, name, description_html, type_id, state, priority,
external_source, assignees(JSON), labels(JSON), extra_properties(JSON), cycle_id
```

转换规则：

- `assignees` = `json.dumps([uid])` 或 `json.dumps([])`（未匹配时）
- `labels` = `json.dumps([])`（Jira labels 未导出时）
- `extra_properties` = `json.dumps({"key1": "val1", ...})`（仅包含非空的 extra property 列）
- `cycle_id` = cycle UUID（从 sprint 匹配；无 sprint 或不关联时空字符串）
- `description_html`：每行包进 `<p>`，空行用 `<p></p>`
- `state`：用匹配到的 Plane state UUID

**展示前 3 行预览**，等待用户确认后继续。

---

### Phase 5：IMPORT（执行导入）

读取 import_ready CSV，逐行 POST（间隔 0.3s 防限流）：

```bash
POST /api/v1/workspaces/ficc/projects/<PROJECT_ID>/issues/
{
  "name": ..., "description_html": ..., "type_id": ..., "state": ...,
  "priority": "none", "external_source": "jira", "external_id": ...,
  "assignees": [...], "labels": [...], "extra_properties": {...}
}
```

成功后，如有 cycle_id：

```bash
POST /api/v1/workspaces/ficc/projects/<PROJECT_ID>/cycles/<cycle_id>/cycle-issues/
{"issues": ["<issue_id>"]}
```

**重复保护**：若 HTTP 返回 400 且含 `external_id` 字段，说明已存在。询问用户：

- `s` = 跳过（skip）
- `o` = 覆盖（PATCH 已存在的 issue）
- `a` = 全部跳过后续重复项

**最终汇总**：

```
成功: XX  跳过: XX  失败: XX
失败列表: [...]
```

---

## 注意事项

- **限流保护**：REST API 调用之间 sleep 0.3s，批量操作若触发 429 则 sleep 5s 后重试一次
- **name 截断**：超过 255 字符的 summary 截断并在 GAP REPORT 中提示
- **空 assignee**：未匹配到 Plane 用户的 assignee 在 GAP REPORT 中列出，导入时 assignees=[]
- **sprint.1**：若 CSV 有多个 sprint 列，只处理 sprint.0 作为主 cycle 关联
- **import_ready CSV 复用**：如用户说"直接导入"且 import_ready 文件已存在，跳过 Phase 1-4
