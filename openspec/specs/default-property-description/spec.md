# Default Property Description

## Purpose

定义工作项默认属性（Title、Description、Reporter 等）的自定义 description 配置功能：在 project work item type 设置页允许管理员为每个默认属性添加说明文字，并在工作项详情页（侧边栏、主内容区、创建表单）以 ℹ️ 图标 + 弹窗的形式向用户展示。

## Requirements

### Requirement: 默认属性 description 配置存储

系统 SHALL 在 localStorage 中，以 workspace + issue type 为维度，存储每个默认属性的自定义 description。

#### Scenario: 保存 description

- **WHEN** 用户在设置页为某个默认属性输入 description
- **THEN** 系统 SHALL 将 description 保存到 localStorage，key 为 `plane-default-prop-config`
- **AND** 数据结构 SHALL 为 `{ [workspaceSlug]: { [issueTypeId]: { [propertyKey]: { description: string } } } }`

#### Scenario: 读取 description

- **WHEN** 页面加载时
- **THEN** 系统 SHALL 从 localStorage 读取已保存的配置并初始化 MobX store
- **AND** 若 localStorage 中无数据，SHALL 使用空对象作为初始值

#### Scenario: 清空 description

- **WHEN** 用户将 description 清空（输入框置空）
- **THEN** 系统 SHALL 将该属性的 description 保存为空字符串
- **AND** ℹ️ 图标 SHALL 不再显示

---

### Requirement: 设置页默认属性 description 编辑 UI

在 project work item type 设置页的展开面板中，SHALL 新增 "Default Properties" 区块，允许为每个默认属性配置 description。

#### Scenario: 展示默认属性列表

- **WHEN** 用户展开某个已启用的 work item type
- **THEN** 面板顶部 SHALL 显示 "Default Properties" 区块
- **AND** 区块 SHALL 列出 12 个可配置默认属性：Title、Description、Reporter、Assignees、Priority、Labels、Start Date、Due Date、Estimate、Modules、Cycle、Parent
- **AND** State 和 Work Item Type 属性 SHALL NOT 出现在列表中

#### Scenario: 编辑 description

- **WHEN** 用户点击某个属性行的 description 输入区域
- **THEN** 该行 SHALL 显示一个 textarea，允许用户输入多行文本（支持 Markdown 语法）
- **AND** 输入框 SHALL 显示 placeholder "Add description (supports Markdown)…"

#### Scenario: 自动保存

- **WHEN** 用户修改 description 时（onChange 事件）
- **THEN** 系统 SHALL 立即将新值保存到 localStorage
- **AND** 不需要额外的"保存"按钮

#### Scenario: 只读模式

- **WHEN** 当前用户无编辑权限
- **THEN** description 输入区域 SHALL 不可编辑

---

### Requirement: 侧边栏默认属性 description 图标展示

在 issue 详情侧边栏，当属性有 description 且 issue 已设置 type 时，SHALL 在属性 label 旁显示 ℹ️ 图标。

#### Scenario: 显示 ℹ️ 图标

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的该属性有非空 description
- **THEN** 对应的 SidebarPropertyListItem 的 label 旁 SHALL 显示 ℹ️ 图标

#### Scenario: 点击 ℹ️ 显示弹窗

- **WHEN** 用户点击 ℹ️ 图标
- **THEN** 系统 SHALL 显示一个浮层，以 Markdown 格式渲染 description 内容

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
- **THEN** title 输入框右侧 SHALL 显示 ℹ️ 图标，弹窗向左展开

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

#### Scenario: 多语言支持

- **WHEN** 界面语言切换时
- **THEN** "Title" 和 "Description" 标签 SHALL 通过 `t("title")` / `t("description")` i18n key 渲染
