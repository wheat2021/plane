## Why

FICC 团队在 Jira 中维护了 0425 迭代的需求清单（40条 Requirement）和重点项目列表（10个周期性报告），需要将其迁移到 Plane 以便统一管理。当前 Plane 的 Requirement 工作项类型缺少必要的业务字段，也没有对应的 Cycle 和 Module。

## What Changes

- 创建 Cycle `大象-常规-26-0425`（2026-03-29 → 2026-04-25）
- 将 10 个 Jira 周期性报告导入为 Plane Module（1个已存在，补充 external_id）
- 为 Requirement 类型新增 14 个 extra properties（所属部门、一级/二级/三级分类、境内外类别、所属中心、所属团队、固收产品经理、业务优先级、IT产品经理、是否纳入交付、预估迭代、交付内容、备注）
- 将 40 条需求从 xlsx 导入为 Requirement issue，全部关联至 0425 Cycle，5条有项目标签的需求同时关联对应 Module
- 重点项目标签**不**创建为 extra property，改用 Module 原生关联

## Capabilities

### New Capabilities

- `import-0425-cycle-and-modules`: 创建 0425 迭代 Cycle 并将 Jira 周期性报告批量导入为 Module
- `import-0425-requirement-extra-properties`: 为 Requirement 工作项类型新增 14 个业务字段
- `import-0425-requirement-issues`: 将 40 条需求从 xlsx 批量导入为 Requirement issue 并关联 Cycle / Module

### Modified Capabilities

（无）

## Impact

- **数据变更**：Plane FICC 项目新增 Cycle × 1、Module × 9（更新 × 1）、ExtraPropertyConfig × 14、IssueTypeExtraProperty × 14、Issue × 40
- **源文件**：`jira_data/26-0425迭代需求(业务+内生).xlsx`、`jira_data/Jira 2026-03-23T17_01_28+0800.csv`
- **无代码改动**：全部通过 REST API 和 Django shell 操作数据库，不修改任何源代码
- **上游冲突风险**：无（纯数据导入操作）
