# 工作项类型（Issue Types）API 说明

> 平台内置了多种工作项类型，包括 **Milestone（里程碑）** 和 **Report（报告）**，
> 用于在项目（module）中标记关键交付节点和进度总结。

## 目录

- [查询可用类型](#查询可用类型)
- [创建工作项时指定类型](#创建工作项时指定类型)
- [内置类型说明](#内置类型说明)
- [项目级类型管理](#项目级类型管理)

---

## 查询可用类型

### 工作区级别（全局类型列表）

```bash
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/issue-types/"
```

**响应示例：**

```json
[
  {
    "id": "aa000000-0000-0000-0000-000000000001",
    "name": "Task",
    "description": "Standard task",
    "is_default": true,
    "is_active": true,
    "level": 1
  },
  {
    "id": "bb000000-0000-0000-0000-000000000002",
    "name": "里程碑",
    "description": "Milestone — 交付阶段节点",
    "is_default": false,
    "is_active": true,
    "level": 3,
    "icon": {
      "name": "flag",
      "color": "#f59e0b"
    }
  },
  {
    "id": "cc000000-0000-0000-0000-000000000003",
    "name": "报告",
    "description": "Report — 进度总结",
    "is_default": false,
    "is_active": true,
    "level": 3,
    "icon": {
      "name": "file-chart",
      "color": "#8b5cf6"
    }
  }
]
```

### 获取 Milestone 类型的 UUID

```bash
# 过滤出 Milestone 类型
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/issue-types/" \
  | python3 -c "
import json, sys
types = json.load(sys.stdin)
milestone = next((t for t in types if '里程碑' in t['name'] or 'Milestone' in t['name']), None)
print('Milestone type_id:', milestone['id'] if milestone else 'Not found')
"
```

### 项目（空间）级别可用类型

```bash
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/"
```

---

## 创建工作项时指定类型

在创建工作项时，通过 `type_id` 字段指定工作项类型。

### 步骤 1：获取 Milestone 类型 UUID

```bash
MILESTONE_TYPE_ID=$(curl -s -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/issue-types/" \
  | python3 -c "
import json, sys
types = json.load(sys.stdin)
m = next((t for t in types if '里程碑' in t.get('name', '') or 'Milestone' in t.get('name', '')), None)
print(m['id'] if m else '')
")
echo "Milestone type_id: $MILESTONE_TYPE_ID"
```

### 步骤 2：创建 Milestone 类型的工作项

```bash
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"v2.0 功能上线\",
    \"type_id\": \"$MILESTONE_TYPE_ID\",
    \"state_id\": \"<state-uuid>\",
    \"target_date\": \"2026-06-30\"
  }" \
  "http://localhost:8000/api/v1/workspaces/<slug>/projects/<project-id>/work-items/"
```

**响应示例（201）：**

```json
{
  "id": "dd000000-0000-0000-0000-000000000010",
  "name": "v2.0 功能上线",
  "type_id": "bb000000-0000-0000-0000-000000000002",
  "sequence_id": 88,
  "target_date": "2026-06-30",
  ...
}
```

### 创建 Report 类型的工作项

```bash
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 进度总结报告",
    "type_id": "<report-type-uuid>",
    "state_id": "<state-uuid>"
  }' \
  "http://localhost:8000/api/v1/workspaces/<slug>/projects/<project-id>/work-items/"
```

---

## 内置类型说明

| 类型名称           | 说明                       | 图标       | 颜色               | 特性               |
| ------------------ | -------------------------- | ---------- | ------------------ | ------------------ |
| Task（任务）       | 默认类型，标准开发任务     | -          | -                  | `is_default: true` |
| Bug                | 缺陷跟踪                   | bug        | red                | -                  |
| Story              | 用户故事                   | bookmark   | blue               | -                  |
| Epic               | 史诗，跨多个迭代的大型功能 | -          | -                  | `level: 2`         |
| 里程碑 (Milestone) | 标记交付阶段节点           | flag       | `#f59e0b` (amber)  | `level: 3`         |
| 报告 (Report)      | 阶段进度总结文档           | file-chart | `#8b5cf6` (purple) | `level: 3`         |

---

## 项目级类型管理

### 启用/禁用空间的工作项类型

```bash
# 列出空间当前启用的类型
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/"

# 启用特定类型
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{"issue_type": "<type-uuid>"}' \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/"

# 禁用特定类型
curl -X DELETE \
  -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/<type-uuid>/"
```
