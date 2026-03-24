## Context

Plane 内置 `external_id` + `external_source` 字段用于记录外部系统来源。API 层（`IssueAPIEndpoint.post()`，issue.py 第428-450行）在创建 issue 时检查同项目内 external_id + external_source 是否已存在，若存在则返回 409。

DB 层无唯一约束（`unique=False, null=True`），已有历史数据存在多个相同 external_id 的 issue（如 FICCHEADS-1180 已有4条）。

业务需求：同一个 Jira 需求编号（如 FICCHEADS-1180）可作为多个 cycle 的 Requirement，每个 cycle 对应独立的 Plane issue，`需求编号` 仅为溯源标签，不应有唯一性约束。

## Goals / Non-Goals

**Goals:**

- 新建 `req_source` extra property 替代 `external_id` 存储需求编号
- 将现有所有 Requirement issue 的 `external_id` 值迁移至 `req_source`
- 更新 plane-migrate skill，导入时不再使用 `external_id` / `external_source`

**Non-Goals:**

- 不修改 Plane 源码（不改 issue.py 的 409 检查）
- 不影响其他 work item type（Bug、Story 等）的 external_id 使用
- 不做前端展示变更

## Decisions

### 决定1：用 extra property 而非修改源码

**选择**：新建 `req_source` text EP，放弃 `external_id` 字段。
**理由**：修改 Plane API 源码需重新部署，且 `external_id` 语义是"外部系统唯一 ID"，与本场景（多对一）不符。EP 无任何约束，语义更准确。
**备选**：删除 issue.py 的 409 检查 → 需要代码变更 + 重新部署，上游同步时有冲突风险。

### 决定2：清空 external_id 而非保留双写

**选择**：迁移后将已有 issue 的 `external_id` 和 `external_source` 清空。
**理由**：避免双写产生混淆；plane-migrate skill 后续不再使用这两个字段，清空后数据状态一致。

### 决定3：仅迁移 Requirement 类型

**选择**：只迁移 `type__name='Requirement'` 的 issue，其他类型不动。
**理由**：其他类型（Bug、Story）的 `external_id` 语义可能不同，避免意外覆盖。

## Risks / Trade-offs

- **[风险] 迁移后 external_id 字段为空**：Plane UI 中"外部 ID"列会显示空——已知且可接受，该列对 FICC 项目无实际用途。
- **[风险] 历史导入脚本有 external_id**：旧脚本若再次运行会写入 external_id，与新规范不一致——缓解：更新 skill 后统一用新规范。
- **[Trade-off] req_source 无法通过 Plane 标准 external_id 接口查询**：需通过 EP 过滤，而非 `?external_id=xxx` 参数查询——可接受，目前无此查询需求。

## Migration Plan

1. Django Shell：创建 `req_source` ExtraPropertyConfig + IssueTypeExtraProperty（Requirement 类型）
2. Django Shell：查询所有 Requirement issue，将 `external_id` 写入 `req_source` EP，清空 `external_id` / `external_source`
3. 更新 SKILL.md：字段映射 + Phase 5 导入逻辑
4. 验证：从 Plane UI 检查几条已迁移的 issue，确认 `req_source` 字段显示正确

**回滚**：迁移为数据操作，可通过 Django Shell 将 `req_source` EP 值写回 `external_id` 字段。

## Open Questions

（无）
