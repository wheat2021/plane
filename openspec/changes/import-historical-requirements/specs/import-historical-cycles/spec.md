## ADDED Requirements

### Requirement: 创建 0131 迭代 Cycle

系统 SHALL 存在名为 `大象-常规-26-0131` 的 Cycle，关联至 FICC 项目（PROJECT_ID: `18b7ccc8-4b96-4af0-8c6f-76550cba28a7`），日期范围 2026-01-03 至 2026-01-31，用于承载 0131 迭代历史需求。

#### Scenario: Cycle 创建成功

- **WHEN** 通过 Plane REST API 创建 Cycle，name=`大象-常规-26-0131`，start_date=`2026-01-03`，end_date=`2026-01-31`
- **THEN** API 返回 201，Cycle 存在于 FICC 项目中，日期范围正确

### Requirement: 创建 0307 迭代 Cycle

系统 SHALL 存在名为 `大象-常规-26-0307` 的 Cycle，关联至 FICC 项目，日期范围 2026-02-07 至 2026-03-07，用于承载 0307 迭代历史需求。

#### Scenario: Cycle 创建成功

- **WHEN** 通过 Plane REST API 创建 Cycle，name=`大象-常规-26-0307`，start_date=`2026-02-07`，end_date=`2026-03-07`
- **THEN** API 返回 201，Cycle 存在于 FICC 项目中，日期范围正确

### Requirement: 0328 迭代 Cycle 已存在无需创建

系统 SHALL 复用已存在的 `大象-常规-26-0328` Cycle（2026-02-28 → 2026-03-28），不重复创建。

#### Scenario: 确认 Cycle 存在

- **WHEN** 查询 FICC 项目的 Cycle 列表
- **THEN** `大象-常规-26-0328` 存在，start_date=`2026-02-28`，end_date=`2026-03-28`
