---
name: plane-data
description: FICC 专用 Plane 数据操作助手。提供环境配置、数据模型速查、批量导入/更新模板、Jira 迁移流程和自定义数据源导入。涵盖 Issue/用户/IssueType/EP 的全生命周期管理。
license: MIT
metadata:
  author: ficc-local
  version: "1.0"
---

# Plane 数据操作助手（FICC 专用）

## 调用形式

```
/plane-data <操作描述> [--env dev|prod]
```

默认 `dev`，明确说"生产"或 `--env prod` 时切换。

## 场景路由

根据任务类型，读取对应的 refs 文件获取详细模板和流程：

| 你想做什么                          | 读取 refs/          | 说明                      |
| ----------------------------------- | ------------------- | ------------------------- |
| 查询/创建/更新少量数据              | 本文件即可          | 用下方环境配置 + 执行规则 |
| 创建 IssueType / EP / State / Label | `ops-schema.md`     | Schema 操作模板           |
| 批量导入/更新/删除 Issue            | `ops-issue.md`      | Issue CRUD + 关联模板     |
| 创建用户 / 成员管理                 | `ops-user.md`       | 用户 + Member 操作        |
| Dev→Prod 跨环境迁移                 | `migrate-plane.md`  | State/User/EP UUID 映射   |
| Jira CSV/XLSX 迁移                  | `migrate-jira.md`   | 5 阶段标准流程            |
| 自定义数据源导入                    | `migrate-custom.md` | 迭代式导入流程            |
| 查数据模型字段                      | `model.md`          | 模型字段速查              |
| 遇到奇怪报错                        | `pitfalls.md`       | 已知坑合集                |

> **规则**：先读本文件确定场景，再按需读取 refs。不要一次性读取所有 refs。

---

## 环境配置（唯一真相源）

### Dev 环境

```
BASE_URL    = http://localhost:8000
API_TOKEN   = plane_api_7ad39eb392a542f59bcc59e8fcb92b9d
WORKSPACE   = ficc
CONTAINER   = plane-api-1
```

### 生产环境

```
BASE_URL    = http://10.102.21.231:8080
API_TOKEN   = plane_api_592e30b2a377449db5a6238eb6f54f3b
WORKSPACE   = ficc
CONTAINER   = api
SERVER      = appadmin@10.102.21.231
```

### 项目 ID

| 项目   | Dev                                    | 生产                                   |
| ------ | -------------------------------------- | -------------------------------------- |
| FICC   | `18b7ccc8-4b96-4af0-8c6f-76550cba28a7` | `f5a45eb3-66a3-48cb-8c96-d09f80791645` |
| AURORA | —                                      | `61326292-8542-4bc2-8041-145e294d41d7` |
| MANUAL | —                                      | `5e14ad73-fcc2-4ee6-946d-9a8c73c08571` |

> ⚠️ 用户未指定项目时**必须询问**，不要默认使用任何项目 ID。

### 认证

```
REST API:     X-Api-Key: <API_TOKEN>
Django Shell: docker exec -i <CONTAINER> python manage.py shell
生产 Shell:   ssh <SERVER> "docker exec -i <CONTAINER> python manage.py shell"
```

---

## 执行方式选择规则

| 条件                          | 方式                          |
| ----------------------------- | ----------------------------- |
| 查询操作                      | REST API                      |
| 操作 ≤ 20 条                  | REST API                      |
| 操作 > 20 条                  | Django Shell bulk_create      |
| 创建 IssueType / EP / Binding | Django Shell                  |
| 创建 Cycle / Module           | Django Shell（REST 有 bug）   |
| 关联已完成 Cycle              | Django Shell（REST 返回 400） |
| 需要触发通知/活动日志         | REST API                      |

> **原则**：优先用 ORM 查询获取数据，避免不必要的外部数据文件传输。例如获取 workspace 全部用户，直接在脚本中查 `WorkspaceMember`，无需先 REST API 导出再传文件。

### Django Shell 执行模式

```bash
# Dev — 简单操作
docker exec -i plane-api-1 python manage.py shell << 'EOF'
...
EOF

# 生产 — 简单操作（无中文、无外部数据）
ssh appadmin@10.102.21.231 "docker exec -i api python manage.py shell << 'EOF'
...
EOF"

# 生产 — 推荐方式（中文安全、支持外部数据文件）
# 1. 写脚本到本地 /tmp/xxx.py
# 2. scp 到服务器 + docker cp 数据文件到容器
# 3. cat script.py | ssh ... "docker exec -i api python manage.py shell"
```

> ⚠️ 生产脚本需要读取外部数据时，**不能用 stdin**（已被脚本本身占用）。
> 必须先 `docker cp` 数据文件到容器内，脚本中用 `open('/tmp/data.json')` 读取。

---

## 数据文件规范

每次数据操作任务在 `data/<任务名>/` 下组织文件：

```
data/<任务名>/
├── README.md            # 任务说明、执行记录
├── users.json           # [{display_name, email}]
├── issues.json          # [{name, state, assignees, extra_properties, ...}]
├── import_users.py      # 用户导入脚本（可选）
├── import_issues.py     # Issue 导入脚本（可选）
└── source/              # 原始数据文件（可选）
```

### 生产导入标准流程

```bash
# 1. 传输到生产服务器
rsync -av data/<任务名>/ appadmin@10.102.21.231:/home/appadmin/plane-data/<任务名>/

# 2. 执行（在生产服务器上）
ssh appadmin@10.102.21.231 "cd /home/appadmin/plane-data/<任务名> && python3 import_users.py --env prod"
ssh appadmin@10.102.21.231 "cd /home/appadmin/plane-data/<任务名> && python3 import_issues.py --env prod"
```

---

## REST API 速查

```bash
# Issues
GET    /api/v1/workspaces/{ws}/projects/{pid}/issues/?state={sid}&assignees={uid}
POST   /api/v1/workspaces/{ws}/projects/{pid}/issues/
PATCH  /api/v1/workspaces/{ws}/projects/{pid}/issues/{id}/
DELETE /api/v1/workspaces/{ws}/projects/{pid}/issues/{id}/

# States
GET    /api/v1/workspaces/{ws}/projects/{pid}/states/

# Members
GET    /api/v1/workspaces/{ws}/members/

# Cycles
GET    /api/v1/workspaces/{ws}/projects/{pid}/cycles/?per_page=50
POST   /api/v1/workspaces/{ws}/projects/{pid}/cycles/{cid}/cycle-issues/

# Modules
GET    /api/v1/workspaces/{ws}/projects/{pid}/modules/?per_page=100
POST   /api/v1/workspaces/{ws}/projects/{pid}/modules/{mid}/module-issues/
```

> 创建 Issue 时字段名是 `"state"` 不是 `"state_id"`。详见 `refs/pitfalls.md`。
