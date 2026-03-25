## Why

`reimport_all.py` 当前混用 REST API（创建 issue）和 Django Shell（创建 Cycle/Module、关联 Cycle），导致两类问题：REST API 有限流（429）和已完成 Cycle 拒绝关联（400）。探索阶段已确认 issue 创建可以完全改用 Django Shell ORM，速度提升 10x+，彻底消除限流和 Cycle 状态限制。同时，0131~0425 四个已结束迭代的需求应以 closed 终态导入，避免"Cycle 已关闭但 issue 仍为 open"的数据不一致。

## What Changes

- **改造 `reimport_all.py`**：issue 创建从 REST API 改为 Django Shell `bulk_create`，全流程（创建 issue + 关联 Cycle + 关联 Module）均通过 Django Shell 完成，移除 `requests` 依赖和限流重试逻辑
- **更新 `plane-migrate` 技能文档**：补充"全 Django Shell 导入"模式说明，记录 API vs Django Shell 的适用场景
- **新增 closed 终态逻辑**：0131/0307/0328/0425 四个迭代的 Requirement 导入时 state 使用项目的 closed/cancelled state；0523 保持原始 state

## Capabilities

### New Capabilities

- `django-shell-bulk-import`：通过 Django Shell `bulk_create` 批量创建 Issue + CycleIssue + ModuleIssue，无限流、无 Cycle 状态限制

### Modified Capabilities

- `reimport-requirements`：issue 创建方式从 REST API 改为 Django Shell，新增 closed 终态逻辑

## Impact

- `jira_data/reimport_all.py`：重写 issue 创建和关联逻辑，移除 `requests` 调用
- `.kiro/skills/plane-migrate/SKILL.md`：补充 Django Shell 全量导入模式
- 不修改 Plane 源码，无上游冲突风险
