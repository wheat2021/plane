## Why

Plane 内置的 `external_id` 字段在 API 层强制唯一约束（同一项目内 external_id + external_source 不可重复），导致同一个 Jira 需求编号在多个 cycle 中重复导入时发生 409 冲突。`external_id` 应仅作为溯源标签，不应限制创建。

## What Changes

- 新建 `req_source` extra property（Requirement 类型，text 类型），用于存储需求来源编号（JIRA ID 或内部需求申请号）
- 将所有已有 Requirement issue 的 `external_id` 值迁移至 `req_source` EP，并清空 `external_id` / `external_source` 字段
- 更新 plane-migrate skill：需求编号列改为写入 `req_source` EP，POST payload 不再传 `external_id` / `external_source`，删除 409 重复保护逻辑

## Capabilities

### New Capabilities

- `req-source-ep`：为 Requirement work item type 新增 `req_source` extra property，替代 `external_id` 存储需求来源编号

### Modified Capabilities

（无 spec 层面的行为变更）

## Impact

- **Django Shell**：创建 ExtraPropertyConfig + IssueTypeExtraProperty，批量迁移 Issue 数据
- **plane-migrate SKILL.md**：字段映射、Phase 5 导入逻辑、重复保护逻辑均需更新
- **上游冲突风险**：低。`extra_id` 字段为 Plane 原生，迁移后不修改模型，只操作数据；SKILL.md 为本地文件，无上游冲突风险
