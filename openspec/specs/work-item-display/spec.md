## MODIFIED Requirements

### Requirement: Work Item Icon Consistency

Previously: The system SHALL display the correct work item type icon immediately upon creation in all list views.

The system SHALL display the correct work item type icon immediately upon creation in all list views. Additionally, the system SHALL support rendering extra properties alongside system properties in a unified style.

#### Scenario: Quick Add in List View

- **WHEN** user creates a new work item using the Quick Add feature in the list view
- **THEN** the new row appears with the icon corresponding to the created item's type (e.g., Bug, Feature)
- **AND** the icon is NOT the default 'Task' icon unless the created item is actually of type 'Task'

#### Scenario: Extra properties display in list view

- **WHEN** a work item is displayed in list view
- **AND** the view has extra properties selected in display settings
- **THEN** the extra properties SHALL render in the same row as system properties
- **AND** the visual style SHALL be consistent with system property controls

#### Scenario: Extra properties display in kanban view

- **WHEN** a work item card is displayed in kanban view
- **AND** the view has extra properties selected in display settings
- **THEN** the extra properties SHALL render in the card's property area
- **AND** the visual style SHALL be consistent with system property controls

## ADDED Requirements

### Requirement: WorkItemLayoutAdditionalProperties 扩展点实现

`WorkItemLayoutAdditionalProperties` 组件 SHALL 实现额外属性在各视图布局中的渲染。

#### Scenario: 组件接收显示配置

- **WHEN** `WorkItemLayoutAdditionalProperties` 被渲染
- **THEN** 它 SHALL 接收 `extraDisplayProperties` prop 指定要显示的额外属性

#### Scenario: 根据类型绑定渲染属性

- **WHEN** 组件渲染某个额外属性
- **AND** 当前工作项的 `type_id` 已绑定该属性
- **THEN** 组件 SHALL 渲染可交互的属性控件

#### Scenario: 未绑定属性的禁用显示

- **WHEN** 组件渲染某个额外属性
- **AND** 当前工作项的 `type_id` 未绑定该属性
- **THEN** 组件 SHALL 渲染禁用状态的灰色控件
- **AND** 控件 SHALL 不响应用户交互
