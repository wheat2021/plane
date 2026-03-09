## MODIFIED Requirements

### Requirement: List 布局额外属性渲染

Previously: List 视图布局 SHALL 在工作项行中显示选中的额外属性。有效属性以可编辑控件显示，无效属性（类型未绑定）以灰色禁用状态显示。

List 视图布局 SHALL 在工作项行中显示选中的额外属性。有效属性以可编辑控件显示，无效属性（类型未绑定）以灰色禁用状态显示。Condition property SHALL 根据父属性当前值条件可编辑：匹配触发选项时可编辑，不匹配时以灰色禁用状态显示。

#### Scenario: 渲染有效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型已绑定该属性
- **THEN** 该属性 SHALL 以可编辑控件形式显示
- **AND** 控件样式 SHALL 与系统属性控件保持一致

#### Scenario: 渲染无效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用状态显示
- **AND** 鼠标悬停 SHALL 显示提示 "此属性对当前工作项类型不可用"

#### Scenario: 属性位置一致性

- **WHEN** 列表中有多个不同类型的工作项
- **THEN** 额外属性 SHALL 在所有行中保持相同的列位置
- **AND** 无效属性显示为灰色占位而非隐藏

#### Scenario: Condition property 条件匹配时可编辑

- **WHEN** 某个 condition property 被选中显示
- **AND** 当前工作项的父属性值匹配触发选项
- **THEN** 该 condition property SHALL 以可编辑控件形式显示

#### Scenario: Condition property 条件不匹配时灰色占位

- **WHEN** 某个 condition property 被选中显示
- **AND** 当前工作项的父属性值不匹配触发选项（或父属性未设置值）
- **THEN** 该 condition property SHALL 以灰色禁用状态显示（同无效属性的展示效果）
- **AND** 保持列位置一致，不因条件不匹配而隐藏

### Requirement: Kanban 布局额外属性渲染

Previously: Kanban 视图布局 SHALL 在卡片中显示选中的额外属性。有效属性正常显示，无效属性灰色禁用。

Kanban 视图布局 SHALL 在卡片中显示选中的额外属性。有效属性正常显示，无效属性灰色禁用。Condition property SHALL 根据父属性当前值条件显示。

#### Scenario: 卡片中渲染额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型已绑定该属性
- **THEN** 该属性 SHALL 在卡片的属性区域显示

#### Scenario: 卡片中渲染无效属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用样式显示

#### Scenario: Condition property 条件匹配时在卡片中可编辑

- **WHEN** condition property 被选中显示
- **AND** 工作项的父属性值匹配触发选项
- **THEN** 该 condition property SHALL 在卡片中以可编辑控件显示

#### Scenario: Condition property 条件不匹配时在卡片中灰色显示

- **WHEN** condition property 被选中显示
- **AND** 工作项的父属性值不匹配触发选项
- **THEN** 该 condition property SHALL 以灰色禁用样式显示

### Requirement: Spreadsheet 布局额外属性渲染

Previously: Spreadsheet 视图布局 SHALL 支持额外属性列。有效属性可编辑，无效属性灰色不可编辑。

Spreadsheet 视图布局 SHALL 支持额外属性列。有效属性可编辑，无效属性灰色不可编辑。Condition property 列 SHALL 根据每行工作项的父属性值条件可编辑。

#### Scenario: 添加额外属性列

- **WHEN** 某个额外属性被选中显示
- **THEN** Spreadsheet SHALL 在表格中添加对应的列
- **AND** 列标题 SHALL 显示属性的 label

#### Scenario: 编辑有效属性单元格

- **WHEN** 用户点击某个有效额外属性的单元格
- **THEN** 单元格 SHALL 进入编辑模式
- **AND** 根据属性类型显示相应的编辑控件

#### Scenario: 无效属性单元格

- **WHEN** 某行工作项的类型未绑定该额外属性
- **THEN** 该单元格 SHALL 显示为灰色不可编辑状态

#### Scenario: Condition property 条件匹配时单元格可编辑

- **WHEN** 某行工作项的父属性值匹配 condition property 的触发选项
- **THEN** 该单元格 SHALL 可编辑

#### Scenario: Condition property 条件不匹配时单元格灰色

- **WHEN** 某行工作项的父属性值不匹配 condition property 的触发选项
- **THEN** 该单元格 SHALL 显示为灰色不可编辑状态
