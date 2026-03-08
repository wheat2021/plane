# 扩展属性（Extra Properties）API 说明

> **重要说明**：服务端对 `extra_properties` 字段内容**不做 schema 校验**。
> 写入未配置的 key 不会报错，但该值不会在 UI 中渲染。
> 建议只写入工作区设置页面中已配置的 key。

## 目录

- [工作区级扩展属性 CRUD](#工作区级扩展属性-crud)
- [项目级绑定](#项目级绑定)
- [工作项 extra_properties 字段读写](#工作项-extra_properties-字段读写)

---

## 工作区级扩展属性 CRUD

> 路径：`/api/workspaces/<slug>/extra-properties/`（主 API，非 v1）

### 列出所有扩展属性

```bash
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/extra-properties/"
```

**响应示例：**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "display_name": "PR 链接",
    "field_key": "pr_url",
    "field_type": "text",
    "is_required": false,
    "is_active": true,
    "description": "关联 PR 的 URL",
    "workspace": "my-workspace"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "display_name": "来源",
    "field_key": "source",
    "field_type": "text",
    "is_required": false,
    "is_active": true,
    "description": "工作项来源（如 ci-cd、jira）",
    "workspace": "my-workspace"
  }
]
```

### 创建扩展属性

```bash
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "部署环境",
    "field_key": "deploy_env",
    "field_type": "text",
    "description": "目标部署环境"
  }' \
  "http://localhost:8000/api/workspaces/<slug>/extra-properties/"
```

### 更新扩展属性

```bash
curl -X PATCH \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "部署目标环境"}' \
  "http://localhost:8000/api/workspaces/<slug>/extra-properties/<property-id>/"
```

### 删除扩展属性

```bash
curl -X DELETE \
  -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/extra-properties/<property-id>/"
```

---

## 项目级绑定

> 扩展属性在工作区级定义后，需绑定到指定空间（project）的工作项类型才会生效。

### 列出空间的绑定

```bash
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/<type-id>/extra-properties/"
```

### 绑定扩展属性到工作项类型

```bash
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "extra_property": "<property-id>",
    "is_required": false
  }' \
  "http://localhost:8000/api/workspaces/<slug>/projects/<project-id>/issue-types/<type-id>/extra-properties/"
```

---

## 工作项 extra_properties 字段读写

> `extra_properties` 是工作项上的一个 JSON 字典字段，键值对结构为 `{"<field_key>": "<value>"}`。

### 键值对结构

```json
{
  "extra_properties": {
    "<field_key_1>": "<value_1>",
    "<field_key_2>": "<value_2>"
  }
}
```

其中 `field_key` 对应工作区扩展属性的 `field_key` 字段（如 `pr_url`、`source`）。

### 创建工作项时写入 extra_properties

```bash
curl -X POST \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "修复登录 Bug",
    "state_id": "<state-uuid>",
    "extra_properties": {
      "source": "ci-cd",
      "pr_url": "https://github.com/org/repo/pull/123"
    }
  }' \
  "http://localhost:8000/api/v1/workspaces/<slug>/projects/<project-id>/work-items/"
```

**响应示例（201）：**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "修复登录 Bug",
  "sequence_id": 42,
  "extra_properties": {
    "source": "ci-cd",
    "pr_url": "https://github.com/org/repo/pull/123"
  },
  ...
}
```

### 更新工作项的 extra_properties

```bash
curl -X PATCH \
  -H "X-Api-Key: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "extra_properties": {
      "source": "ci-cd",
      "pr_url": "https://github.com/org/repo/pull/456",
      "deploy_env": "staging"
    }
  }' \
  "http://localhost:8000/api/v1/workspaces/<slug>/projects/<project-id>/work-items/<work-item-id>/"
```

> **注意**：PATCH `extra_properties` 会整体替换该字段，不是增量合并。如需保留已有值，请在请求中包含所有需要保留的键。

### 读取工作项的 extra_properties

```bash
curl -H "X-Api-Key: <token>" \
  "http://localhost:8000/api/v1/workspaces/<slug>/projects/<project-id>/work-items/<work-item-id>/"
```

响应体中包含 `"extra_properties": {...}`。

---

## 无效字段行为说明

写入未在工作区配置的 `field_key`：

- **不报错**：API 返回 2xx，值被存储在数据库中
- **不渲染**：UI 中不会显示该字段
- **可读取**：通过 API GET 仍能读取存储的值

建议在自动化脚本中，先调用 `GET /api/workspaces/<slug>/extra-properties/` 获取有效 key 列表，再写入对应值。
