# 场景：Dev→Prod 跨环境迁移

> 将 dev 环境的 IssueType、EP、Issue 完整迁移到生产环境的指定项目。
> 核心难点：State/User/EP 中 member UUID 需要跨环境映射。

## 工作流

### 1. 确认目标

明确源项目和目标项目（环境 + 项目 ID），以及要迁移的 IssueType 列表。

### 2. 导出源数据

从 dev 环境导出，**用 name/email 作为桥接键**（不要用 UUID）：

```python
# 导出脚本要点：
# - state: 存 state.name（不是 state_id）
# - assignee: 存 email（不是 user UUID）
# - member EP: 额外存 _developer_email（通过 UUID 反查 email）
# - 输出为 JSON 文件
```

### 3. 准备目标环境

按依赖顺序创建（每步都用 `get_or_create` 保证幂等）：

```
1. State     — 比对 name，缺失的创建
2. User      — 比对 email，缺失的创建 + 加入 workspace/project
3. IssueType — workspace 级，get_or_create by name
4. EP Config — workspace 级，get_or_create by key（已有则复用）
5. EP Binding — project 级，每个目标项目单独绑定
```

### 4. 导入并映射

```python
# 映射构建：
state_map  = {s.name: s.id for s in State.objects.filter(project=target_proj)}
email_to_uid = {u.email: str(u.id) for u in User.objects.filter(...)}

# Issue 导入时：
# - state_id = state_map[item['state_name']]
# - member EP: ep['developer'] = email_to_uid[item['_developer_email']]
# - assignee: 通过 email 查 prod user UUID
```

### 5. 建立 Relation

Issue 创建完成后，按业务逻辑建立 `IssueRelation`（见 `ops-issue.md`）。

## 常见映射陷阱

| 字段      | 陷阱                           | 解法                                                   |
| --------- | ------------------------------ | ------------------------------------------------------ |
| state     | 源和目标的 state name 不同     | 先列出两边 state，手动确认映射                         |
| member EP | 存的是 user UUID，跨环境不通用 | 导出时转为 email，导入时反查目标 UUID                  |
| EP config | 目标环境可能已有同 key 的 EP   | `get_or_create` 自动复用，但需检查 config 内容是否一致 |
