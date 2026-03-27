## MODIFIED Requirements

### Requirement: 默认属性 description 配置存储

系统 SHALL 在 localStorage 中，以 workspace + issue type 为维度，存储每个默认属性的自定义 description 和 alias。

#### Scenario: 保存 description

- **WHEN** 用户在设置页为某个默认属性输入 description
- **THEN** 系统 SHALL 将 description **合并**保存到 localStorage，key 为 `plane-default-prop-config`
- **AND** 数据结构 SHALL 为 `{ [workspaceSlug]: { [issueTypeId]: { [propertyKey]: { alias?: string; description?: string } } } }`
- **AND** 已有的 alias 字段 SHALL NOT 被覆盖

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

在 project work item type 设置页的展开面板中，SHALL 展示 "Default Properties" 区块，允许为每个默认属性配置 alias 和 description。

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

- **WHEN** 用户修改 description 或 alias 时（onChange 事件）
- **THEN** 系统 SHALL 立即将新值保存到 localStorage
- **AND** 不需要额外的"保存"按钮

#### Scenario: 只读模式

- **WHEN** 当前用户无编辑权限
- **THEN** description 和 alias 输入区域 SHALL 不可编辑
