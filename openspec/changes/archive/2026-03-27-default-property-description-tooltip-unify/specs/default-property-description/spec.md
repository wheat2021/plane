# Default Property Description（变更）

## MODIFIED Requirements

### Requirement: 侧边栏默认属性 description 图标展示

在 issue 详情侧边栏，当属性有 description 且 issue 已设置 type 时，SHALL 在属性 label 旁显示 ℹ️ 图标。

#### Scenario: 显示 ℹ️ 图标

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的该属性有非空 description
- **THEN** 对应的 SidebarPropertyListItem 的 label 旁 SHALL 显示 ℹ️ 图标

#### Scenario: 点击 ℹ️ 显示弹窗

- **WHEN** 用户点击 ℹ️ 图标
- **THEN** 系统 SHALL 通过 `DefaultPropertyTooltip` 组件显示 tooltip，以 Markdown 格式渲染 description 内容

#### Scenario: type_id 为 null 时不显示

- **WHEN** issue.type_id 为 null
- **THEN** 所有默认属性的 ℹ️ 图标 SHALL NOT 显示，无论是否配置了 description

#### Scenario: description 为空时不显示

- **WHEN** 某属性的 description 为空字符串
- **THEN** 该属性的 ℹ️ 图标 SHALL NOT 显示

---

### Requirement: 主内容区 title/description 字段图标展示

在 issue 详情主内容区（main-content 和 peek-overview），title 和 description 字段 SHALL 在有对应 description 配置时显示 ℹ️ 图标。

#### Scenario: title 图标展示

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的 "title" 属性有非空 description
- **THEN** title 输入框右侧 SHALL 显示 ℹ️ 图标，tooltip 向左展开

#### Scenario: description 图标展示

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的 "description" 属性有非空 description
- **THEN** 描述区域下方（表情选择器旁）SHALL 显示 ℹ️ 图标

#### Scenario: peek-overview 一致性

- **WHEN** issue 在 peek-overview 模式下打开
- **THEN** title 和 description 的 ℹ️ 图标 SHALL 与 main-content 显示行为一致

---

### Requirement: 创建表单 title/description 字段标签与图标

在"Create new work item"表单中，title 和 description 字段 SHALL 显示标签行，风格与 Additional Properties 区块一致。

#### Scenario: 标签行始终显示

- **WHEN** 创建表单打开时
- **THEN** title 输入框上方 SHALL 显示 "Title \*" 标签行（含必填星号）
- **AND** description 编辑器上方 SHALL 显示 "Description" 标签行
- **AND** 标签样式 SHALL 与 Additional Properties 区块的属性标签一致（`text-body-xs-medium text-secondary`）

#### Scenario: 标签行图标（条件显示）

- **WHEN** 当前选中的 work item type 为 title/description 配置了非空 description
- **THEN** 对应标签行末尾 SHALL 显示 ℹ️ 图标
- **WHEN** 无配置或 type_id 为 null
- **THEN** ℹ️ 图标 SHALL NOT 显示，标签行仍正常显示

## ADDED Requirements

### Requirement: Kanban/List 视图默认属性 description 展示

在 Kanban 和 List 视图的 IssueProperties 组件中，当属性有 description 且 issue 已设置 type 时，SHALL 在属性控件旁显示 ℹ️ 图标。

#### Scenario: IssueProperties 显示 description 图标

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的该属性有非空 description
- **THEN** 该属性的 dropdown 控件旁 SHALL 显示 ℹ️ 图标

#### Scenario: 图标使用 DefaultPropertyTooltip

- **WHEN** 用户点击 ℹ️ 图标
- **THEN** 系统 SHALL 通过 DefaultPropertyTooltip 组件显示 tooltip，以 Markdown 格式渲染 description 内容

#### Scenario: type_id 为 null 时不显示

- **WHEN** issue.type_id 为 null
- **THEN** IssueProperties 中所有默认属性的 ℹ️ 图标 SHALL NOT 显示

#### Scenario: description 为空时不显示

- **WHEN** 某属性的 description 为空字符串
- **THEN** 该属性的 ℹ️ 图标 SHALL NOT 显示
