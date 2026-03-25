## ADDED Requirements

### Requirement: 通过 Django Shell bulk_create 批量创建 Issue

`reimport_all.py` SHALL 将 CSV 数据序列化为 JSON，通过单次 `docker exec` Django Shell 调用完成所有 Issue 的批量创建。

#### Scenario: 批量创建成功

- **WHEN** CSV 包含 189 行有效数据
- **THEN** 通过 `Issue.objects.bulk_create()` 一次性创建所有 Issue，打印 "✅ 创建 Issue: N 条"

#### Scenario: 单条数据异常时跳过

- **WHEN** 某行数据的 state_id 或 type_id 无效
- **THEN** 该行跳过，记录错误，不影响其他行

### Requirement: 0131~0425 迭代使用 Cancelled 终态

`reimport_all.py` SHALL 在创建 Issue 时，对 cycle 名称为 0131/0307/0328/0425 的行，将 state 覆盖为项目的 `group='cancelled'` state。

#### Scenario: 已结束迭代使用 Cancelled state

- **WHEN** CSV 行的 cycle_name 为 "大象-常规-26-0131"、"大象-常规-26-0307"、"大象-常规-26-0328"、"大象-常规-26-0425" 之一
- **THEN** Issue 的 state 设为 Cancelled state UUID（通过 `State.objects.filter(project=proj, group='cancelled').first()` 查询）

#### Scenario: 0523 迭代保持原始 state

- **WHEN** CSV 行的 cycle_name 为 "大象-常规-26-0523"
- **THEN** Issue 的 state 使用 CSV 中的 state_id（Backlog）

### Requirement: 通过 Django Shell bulk_create 关联 CycleIssue 和 ModuleIssue

`reimport_all.py` SHALL 在 Issue 创建完成后，通过 Django Shell `bulk_create` 批量创建 CycleIssue 和 ModuleIssue 关联记录。

#### Scenario: CycleIssue 批量关联

- **WHEN** 所有 Issue 创建完成，收集到 `{cycle_id: [issue_id, ...]}` 映射
- **THEN** 通过 `CycleIssue.objects.bulk_create(..., ignore_conflicts=True)` 一次性关联，打印各 Cycle 关联数量

#### Scenario: ModuleIssue 批量关联

- **WHEN** CSV 行的 module_name 非空且在 module_map 中存在
- **THEN** 通过 `ModuleIssue.objects.bulk_create(..., ignore_conflicts=True)` 关联，打印各 Module 关联数量
