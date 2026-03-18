## ADDED Requirements

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
- **AND** 侧边栏 SHALL 不再显示 ℹ️ 图标

---

### Requirement: 设置页默认属性 description 编辑 UI

在 project work item type 设置页的展开面板中，SHALL 新增 "Default Properties" 区块，允许为每个默认属性配置 description。

#### Scenario: 展示默认属性列表

- **WHEN** 用户展开某个已启用的 work item type
- **THEN** 面板顶部 SHALL 显示 "Default Properties" 区块
- **AND** 区块 SHALL 列出 10 个可配置默认属性：Reporter、Assignees、Priority、Labels、Start Date、Due Date、Estimate、Modules、Cycle、Parent
- **AND** State 和 Issue Type 属性 SHALL NOT 出现在列表中

#### Scenario: 编辑 description

- **WHEN** 用户点击某个属性行的 description 输入区域
- **THEN** 该行 SHALL 显示一个 textarea，允许用户输入多行文本（支持 Markdown 语法）
- **AND** 输入框 SHALL 显示 placeholder "Add description..."

#### Scenario: 自动保存

- **WHEN** 用户修改 description 后 textarea 失去焦点（onBlur）
- **THEN** 系统 SHALL 立即将新值保存到 localStorage
- **AND** 不需要额外的"保存"按钮

#### Scenario: 非编辑状态展示

- **WHEN** description 不为空时
- **THEN** 该行 SHALL 以截断文本形式显示 description 预览（非编辑状态）

#### Scenario: 只读模式

- **WHEN** 当前用户无编辑权限（isEditable 为 false）
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
