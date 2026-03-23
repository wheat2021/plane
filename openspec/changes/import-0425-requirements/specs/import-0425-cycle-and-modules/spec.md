## ADDED Requirements

### Requirement: 创建 0425 迭代 Cycle

系统 SHALL 存在名为 `大象-常规-26-0425` 的 Cycle，关联至 FICC 项目，日期范围 2026-03-29 至 2026-04-25，用于承载本次迭代所有需求。

#### Scenario: 创建 Cycle

- **WHEN** 执行 POST `/api/v1/workspaces/ficc/projects/{PROJECT_ID}/cycles/` 携带 `name="大象-常规-26-0425"`, `start_date="2026-03-29"`, `end_date="2026-04-25"`
- **THEN** 系统创建 Cycle 并返回包含 UUID 的响应，HTTP 200

### Requirement: 将 Jira 周期性报告导入为 Plane Module

系统 SHALL 在 FICC 项目中存在 10 个 Module，每个对应一个 Jira 周期性报告，保留 `external_id`（Jira issue key）和 `external_source="jira"` 用于溯源。

#### Scenario: 批量创建新 Module

- **WHEN** 对 9 个尚不存在的周期性报告执行 POST `/modules/`，携带 `name`、`external_id`、`external_source="jira"`、`status="backlog"`，不设置日期
- **THEN** 系统创建 9 个 Module，HTTP 200，返回各自 UUID

#### Scenario: 更新已存在 Module

- **WHEN** `FICC策略平台整合项目` 已存在（id: `d3aec2ab-36f3-4308-a0fb-83e8e501a6a4`），执行 PATCH 补充 `external_id="FICC-71606"`, `external_source="jira"`
- **THEN** 系统更新该 Module 的溯源字段，不创建重复 Module

#### Scenario: 所有 10 个 Module 均可在 Plane UI 中查看

- **WHEN** 导入完成后访问 FICC 项目的 Modules 列表
- **THEN** 显示 10 个 Module，名称与 Jira 周期性报告 Summary 一致
