## Why

FICC 项目在引入 Plane 之前已有三个历史迭代（0131、0307、0328）的需求清单，以 Excel 形式管理。为完整还原迭代历史、支持跨 Cycle 需求追溯，需将这三个 Cycle 的需求全量导入 Plane。

## What Changes

- 创建两个新 Cycle：`大象-常规-26-0131`（2026-01-03 → 2026-01-31）、`大象-常规-26-0307`（2026-02-07 → 2026-03-07）
- `大象-常规-26-0328` Cycle 已存在，直接复用
- 从三个 Excel 文件各导入全量需求为 Requirement Issue，共约 120 条
- 每条 Issue 标题格式为「需求名 [MMDD]」以区分同名需求在不同 Cycle 的交付
- Issue `external_id` 存储 FICCHEADS key（允许同一 key 在多条 Issue 中重复，对应同一大需求在不同 Cycle 的分段交付）
- 「当前迭代交付内容」列映射为 Issue description
- 为各 Cycle 的 Issue 分别关联对应 Cycle；0328 中有重点项目标签的 Issue 同时关联对应 Module

## Capabilities

### New Capabilities

- `import-historical-cycles`: 创建 0131、0307 两个 Cycle（0328 已存在）
- `import-historical-issues`: 从三个 Excel 批量导入 ~120 条 Requirement Issue 并关联 Cycle/Module

### Modified Capabilities

（无）

## Impact

- **数据层**：新增约 120 个 Issue，2 个 Cycle，无代码改动
- **Excel 文件**：`jira_data/26-0131迭代需求管理（业务+内生）.xlsx`、`jira_data/26-0307迭代需求(业务+内生).xlsx`、`jira_data/26-0328迭代需求(业务+内生).xlsx`
- **列结构差异**：0131 无描述列、无优先级列，IT_PM 在 col12（0307/0328 在 col14）
- **复合 IT_PM 处理**：`钱高翔/朱泓飞` 取后者朱泓飞
- **无上游风险**：纯数据导入，不涉及任何代码文件修改
