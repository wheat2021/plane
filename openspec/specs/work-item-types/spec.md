## MODIFIED Requirements

### Requirement: Project settings Work Item Types page

Previously: The project settings Work Item Types page displays all workspace-defined issue types and allows project admins to enable/disable them and set a default. The expanded area shows extra property bindings.

The project settings Work Item Types page SHALL continue to display all workspace-defined issue types (is_active=True) with enable/disable and default controls. The page SHALL NOT expose create/edit/delete controls for issue types themselves—those are managed exclusively in workspace settings.

The page SHALL reflect `is_system=True` types with a system badge indicator, and SHALL display the type's actual icon from `logo_props` (not hardcoded by name).

#### Scenario: Work item type card is expandable

- **WHEN** the admin views the Work Item Types settings page
- **THEN** each enabled work item type card SHALL have a clickable expand/collapse control

#### Scenario: Expanded card shows extra property bindings with required toggle

- **WHEN** the admin expands a work item type card
- **THEN** the expanded area SHALL display all workspace-defined extra properties as a checkbox list
- **THEN** each checked (bound) property SHALL display an inline "Required" toggle showing the current is_required state

#### Scenario: Toggle required status on bound property

- **WHEN** the admin clicks the "Required" toggle on a bound extra property
- **THEN** the system SHALL call PATCH on the binding API to update is_required and reflect the change in the UI

#### Scenario: Required toggle only visible for bound properties

- **WHEN** an extra property is not bound (checkbox unchecked)
- **THEN** the "Required" toggle SHALL NOT be displayed for that property

#### Scenario: Toggle extra property binding

- **WHEN** the admin checks or unchecks an extra property in the expanded area
- **THEN** the system SHALL create or delete the corresponding IssueTypeExtraProperty binding via the binding API

#### Scenario: Disabled item type not expandable

- **WHEN** a work item type is not enabled for the project
- **THEN** the card SHALL NOT be expandable and SHALL NOT show extra property binding options

#### Scenario: Non-admin cannot modify bindings or required status

- **WHEN** a non-admin user views the work item types settings
- **THEN** the expanded area (if shown) SHALL display bindings and required status as read-only without checkboxes or toggles

#### Scenario: Type icon rendered from logo_props

- **WHEN** a work item type card is displayed on the project settings page
- **THEN** the type's icon SHALL be rendered from `logo_props.icon` (Lucide icon name + color), not hardcoded by type name

#### Scenario: System type badge displayed

- **WHEN** a work item type has `is_system=True`
- **THEN** the type card SHALL display a system badge indicator alongside the type name

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
