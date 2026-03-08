## ADDED Requirements

### Requirement: 内置 Milestone 工作项类型

系统 SHALL 为所有既有 workspace 提供 `Milestone`（里程碑）工作项类型，用于标记 module（业务项目）内的交付阶段节点。

该类型通过 Django migration 种子化，具有以下属性：

- `name`: `"Milestone"`
- `logo_props`: `{"in_use": "icon", "icon": {"name": "flag", "color": "#f59e0b"}}`
- `is_default`: `false`
- `is_active`: `true`
- `level`: `3`

#### Scenario: Milestone 类型出现在工作项类型设置页

- **WHEN** Admin 访问工作区设置 → 工作项类型页面
- **THEN** 类型列表 SHALL 包含「Milestone」条目

#### Scenario: 可将工作项指定为 Milestone 类型

- **WHEN** 用户创建或编辑工作项并选择工作项类型
- **THEN** 类型下拉列表 SHALL 包含「Milestone」选项（前提：该类型已在项目中启用）

#### Scenario: migration 幂等执行

- **WHEN** migration 在已存在 Milestone 类型的 workspace 上执行
- **THEN** 系统 SHALL 跳过创建，不产生重复记录

---

### Requirement: 内置 Report 工作项类型

系统 SHALL 为所有既有 workspace 提供 `Report`（汇报）工作项类型，用于记录 module（业务项目）的进展汇报和阶段总结。

该类型通过 Django migration 种子化，具有以下属性：

- `name`: `"Report"`
- `logo_props`: `{"in_use": "icon", "icon": {"name": "file-chart", "color": "#8b5cf6"}}`
- `is_default`: `false`
- `is_active`: `true`
- `level`: `4`

#### Scenario: Report 类型出现在工作项类型设置页

- **WHEN** Admin 访问工作区设置 → 工作项类型页面
- **THEN** 类型列表 SHALL 包含「Report」条目

#### Scenario: 可将工作项指定为 Report 类型

- **WHEN** 用户创建或编辑工作项并选择工作项类型
- **THEN** 类型下拉列表 SHALL 包含「Report」选项（前提：该类型已在项目中启用）

#### Scenario: migration 幂等执行

- **WHEN** migration 在已存在 Report 类型的 workspace 上执行
- **THEN** 系统 SHALL 跳过创建，不产生重复记录
