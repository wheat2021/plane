# req-source-ep

## Purpose

规范 `req_source`（需求编号）extra property 的绑定、数据迁移及导入行为，确保需求编号通过 extra property 管理，而非依赖 `external_id` 字段。

## Requirements

### Requirement: req_source extra property 存在于 Requirement 类型

Requirement work item type SHALL 包含 `req_source`（需求编号）extra property，类型为 `text`，非必填。

#### Scenario: req_source EP 已绑定到 Requirement 类型

- **WHEN** 查询 FICC 项目 Requirement 类型的 extra properties
- **THEN** 返回列表中包含 key=`req_source`、type=`text`、label=`需求编号` 的配置项

### Requirement: 已有 Requirement issue 的需求编号迁移到 req_source

所有 `external_id` 非空的 Requirement issue，其 `external_id` 值 SHALL 被写入 `req_source` extra property，且 `external_id` 和 `external_source` 字段 SHALL 被清空。

#### Scenario: 迁移后 issue 的 req_source 有值

- **WHEN** 查询已迁移的 Requirement issue
- **THEN** `req_source` extra property 的值等于迁移前的 `external_id` 值

#### Scenario: 迁移后 external_id 为空

- **WHEN** 查询已迁移的 Requirement issue
- **THEN** `external_id` 字段为 `null`，`external_source` 字段为 `null`

### Requirement: plane-migrate 导入时使用 req_source 而非 external_id

plane-migrate skill 执行 Phase 5 导入时，POST payload SHALL 不包含 `external_id` 和 `external_source` 字段；需求编号列 SHALL 写入 `extra_properties.req_source`。

#### Scenario: 相同需求编号可重复导入

- **WHEN** 使用相同 `req_source` 值（如 `FICCHEADS-1180`）导入两次
- **THEN** 两次均创建成功，无 409 冲突，产生两个独立的 Plane issue

#### Scenario: 无需求编号时 req_source 为空

- **WHEN** 导入行的需求编号列为空或 `None`
- **THEN** `req_source` 不写入 extra_properties（不传该字段）
