## MODIFIED Requirements

### Requirement: List 布局额外属性渲染

List 视图布局 SHALL 在工作项行中显示选中的额外属性。

#### Scenario: 渲染有效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型已绑定该属性
- **THEN** 该属性 SHALL 以可编辑控件形式显示
- **AND** 控件样式 SHALL 与系统属性控件保持一致

#### Scenario: 渲染无效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用图标形式显示
- **AND** 图标 SHALL 根据属性类型选择对应的图标组件（text→HashPropertyIcon, select→DropdownPropertyIcon, checkbox→BooleanPropertyIcon）
- **AND** 图标 SHALL 应用 `opacity-40 cursor-not-allowed` 样式
- **AND** 鼠标悬停 SHALL 显示 Tooltip，包含属性名称和提示 "此属性对当前工作项类型不可用"

#### Scenario: 属性位置一致性

- **WHEN** 列表中有多个不同类型的工作项
- **THEN** 额外属性 SHALL 在所有行中保持相同的列位置
- **AND** 无效属性显示为灰色图标占位而非隐藏

### Requirement: Kanban 布局额外属性渲染

Kanban 视图布局 SHALL 在卡片中显示选中的额外属性。

#### Scenario: 卡片中渲染额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型已绑定该属性
- **THEN** 该属性 SHALL 在卡片的属性区域显示

#### Scenario: 卡片中渲染无效属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用图标形式显示
- **AND** 图标 SHALL 根据属性类型选择对应的图标组件
- **AND** 图标 SHALL 应用 `opacity-40 cursor-not-allowed` 样式
- **AND** 鼠标悬停 SHALL 显示 Tooltip，包含属性名称和不可用提示
