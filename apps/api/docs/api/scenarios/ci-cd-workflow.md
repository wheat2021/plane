# CI/CD 集成场景：完整工作流示例

> 本文档展示 CI/CD 系统如何通过 API 与研发管理平台集成，
> 实现从 PR 触发到工作项状态更新的完整自动化流程。

## 场景概述

```
PR 创建/更新
    ↓
创建工作项（关联迭代 + 项目）
    ↓
写入 extra_properties（PR 链接、来源）
    ↓
CI 完成 → 更新工作项状态
    ↓
部署完成 → 再次更新状态 + extra_properties
```

---

## 前置配置

### 环境变量

```bash
export PLANE_BASE_URL="http://localhost:8000"
export PLANE_API_TOKEN="your-api-token-here"
export PLANE_WORKSPACE_SLUG="my-workspace"
export PLANE_PROJECT_ID="<空间 UUID>"        # 对应内部「空间」
export PLANE_MODULE_ID="<项目 UUID>"         # 对应内部「项目」
export PLANE_CYCLE_ID="<迭代 UUID>"          # 对应内部「迭代」
```

### 获取当前活动迭代

```bash
# 列出当前活动迭代（status=current）
ACTIVE_CYCLE=$(curl -s \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/cycles/" \
  | python3 -c "
import json, sys
cycles = json.load(sys.stdin)
# 取第一个活动迭代
active = next((c for c in cycles if c.get('status') == 'current'), None)
print(active['id'] if active else '')
")
echo "Active cycle: $ACTIVE_CYCLE"
```

### 获取「进行中」状态 ID

```bash
IN_PROGRESS_STATE=$(curl -s \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/states/" \
  | python3 -c "
import json, sys
states = json.load(sys.stdin)
# 取 group=started 的第一个状态
s = next((s for s in states if s.get('group') == 'started'), None)
print(s['id'] if s else '')
")

DONE_STATE=$(curl -s \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/states/" \
  | python3 -c "
import json, sys
states = json.load(sys.stdin)
s = next((s for s in states if s.get('group') == 'completed'), None)
print(s['id'] if s else '')
")
```

---

## 步骤 1：PR 触发 → 创建工作项

```bash
# 从 CI 环境获取 PR 信息
PR_NUMBER="${GITHUB_PR_NUMBER:-$(git log --oneline -1)}"
PR_URL="${GITHUB_PR_URL:-https://github.com/org/repo/pull/$PR_NUMBER}"
BRANCH_NAME="${GITHUB_HEAD_REF:-$(git rev-parse --abbrev-ref HEAD)}"

WORK_ITEM_RESPONSE=$(curl -s -X POST \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"[CI] PR #$PR_NUMBER: $BRANCH_NAME\",
    \"state_id\": \"$IN_PROGRESS_STATE\",
    \"cycle_id\": \"$ACTIVE_CYCLE\",
    \"module_id\": \"$PLANE_MODULE_ID\",
    \"extra_properties\": {
      \"source\": \"ci-cd\",
      \"pr_url\": \"$PR_URL\",
      \"branch\": \"$BRANCH_NAME\",
      \"ci_triggered_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/work-items/")

# 提取工作项 ID
WORK_ITEM_ID=$(echo "$WORK_ITEM_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "Created work item: $WORK_ITEM_ID"
```

**预期响应（201）：**

```json
{
  "id": "ee000000-0000-0000-0000-000000000020",
  "name": "[CI] PR #123: feature/login-fix",
  "sequence_id": 99,
  "state_id": "<in-progress-state-uuid>",
  "extra_properties": {
    "source": "ci-cd",
    "pr_url": "https://github.com/org/repo/pull/123",
    "branch": "feature/login-fix",
    "ci_triggered_at": "2026-03-08T10:00:00Z"
  }
}
```

---

## 步骤 2：CI 运行中 → 更新 extra_properties

```bash
# CI 开始执行测试，记录 pipeline URL
curl -s -X PATCH \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"extra_properties\": {
      \"source\": \"ci-cd\",
      \"pr_url\": \"$PR_URL\",
      \"branch\": \"$BRANCH_NAME\",
      \"ci_triggered_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"ci_pipeline_url\": \"$CI_PIPELINE_URL\",
      \"ci_status\": \"running\"
    }
  }" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/work-items/$WORK_ITEM_ID/"
```

> **注意**：PATCH `extra_properties` 是整体替换，请携带所有需要保留的键。

---

## 步骤 3：CI 完成 → 更新状态 + extra_properties

```bash
# CI 成功完成
curl -s -X PATCH \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"state_id\": \"$DONE_STATE\",
    \"extra_properties\": {
      \"source\": \"ci-cd\",
      \"pr_url\": \"$PR_URL\",
      \"branch\": \"$BRANCH_NAME\",
      \"ci_triggered_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"ci_pipeline_url\": \"$CI_PIPELINE_URL\",
      \"ci_status\": \"success\",
      \"ci_completed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/work-items/$WORK_ITEM_ID/"
```

---

## 步骤 4：验证写入结果

```bash
# GET 工作项，确认状态和 extra_properties
curl -s \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/work-items/$WORK_ITEM_ID/" \
  | python3 -m json.tool
```

---

## 完整脚本示例

```bash
#!/bin/bash
# ci-plane-integration.sh
# 在 CI pipeline 末尾调用此脚本更新研发管理平台

set -e

PLANE_BASE_URL="${PLANE_BASE_URL:?请设置 PLANE_BASE_URL}"
PLANE_API_TOKEN="${PLANE_API_TOKEN:?请设置 PLANE_API_TOKEN}"
PLANE_WORKSPACE_SLUG="${PLANE_WORKSPACE_SLUG:?请设置 PLANE_WORKSPACE_SLUG}"
PLANE_PROJECT_ID="${PLANE_PROJECT_ID:?请设置 PLANE_PROJECT_ID}"

WORK_ITEM_ID="$1"
CI_STATUS="$2"  # success | failure

if [ -z "$WORK_ITEM_ID" ]; then
  echo "Usage: $0 <work-item-id> <success|failure>"
  exit 1
fi

# 获取对应状态 ID
if [ "$CI_STATUS" = "success" ]; then
  STATE_GROUP="completed"
else
  STATE_GROUP="cancelled"
fi

STATE_ID=$(curl -s \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/states/" \
  | python3 -c "
import json, sys
states = json.load(sys.stdin)
s = next((s for s in states if s.get('group') == '$STATE_GROUP'), None)
print(s['id'] if s else '')
")

# 更新工作项状态
curl -X PATCH \
  -H "X-Api-Key: $PLANE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"state_id\": \"$STATE_ID\"}" \
  "$PLANE_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PLANE_PROJECT_ID/work-items/$WORK_ITEM_ID/"

echo "Work item $WORK_ITEM_ID updated to $CI_STATUS"
```

---

## 错误处理

| HTTP 状态码 | 含义               | 建议                                            |
| ----------- | ------------------ | ----------------------------------------------- |
| 401         | Token 无效或已过期 | 检查 `X-Api-Key` header                         |
| 403         | 权限不足           | 确认 token 对应的用户角色（需要 Member 或更高） |
| 404         | 资源不存在         | 检查 workspace slug、project ID、work item ID   |
| 400         | 请求体格式错误     | 检查 JSON 格式和必填字段                        |
