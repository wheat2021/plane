# Default Property Alias

## Purpose

定义工作项默认属性（Title、Description、Reporter 等）的自定义 alias 配置功能：允许管理员为每个默认属性设置自定义显示名称（alias），在工作项详情侧边栏、主内容区、Peek Overview 及创建表单中，以 alias 替换默认的 i18n 属性标签文字。

## Requirements

### Requirement: 默认属性 alias 配置存储

系统 SHALL 在 localStorage 中，以 workspace + issue type 为维度，与 description 并排存储每个默认属性的自定义 alias。

#### Scenario: 保存 alias

- **WHEN** 用户在设置页为某个默认属性输入 alias
- **THEN** 系统 SHALL 将 alias 合并保存到 localStorage，key 为 `plane-default-prop-config`
- **AND** 数据结构 SHALL 为 `{ [workspaceSlug]: { [issueTypeId]: { [propertyKey]: { alias?: string; description?: string } } } }`

#### Scenario: setAlias 使用合并写入

- **WHEN** 调用 `setAlias(ws, typeId, key, alias)` 时
- **THEN** 系统 SHALL 读取该 key 的现有对象（含 description），合并写入新 alias
- **AND** 已有的 description 字段 SHALL NOT 被覆盖

#### Scenario: setDescription 使用合并写入

- **WHEN** 调用 `setDescription(ws, typeId, key, description)` 时
- **THEN** 系统 SHALL 读取该 key 的现有对象（含 alias），合并写入新 description
- **AND** 已有的 alias 字段 SHALL NOT 被覆盖

#### Scenario: 读取 alias

- **WHEN** 调用 `getAlias(workspaceSlug, issueTypeId, propertyKey)` 时
- **THEN** 系统 SHALL 返回该属性已保存的 alias 字符串
- **AND** 若未配置，SHALL 返回空字符串 `""`

#### Scenario: 清空 alias

- **WHEN** 用户将 alias 输入框清空
- **THEN** 系统 SHALL 将该属性的 alias 保存为空字符串
- **AND** 渲染时 SHALL 回退到默认 label

---

### Requirement: 设置页 alias 编辑 UI

在 `DefaultPropertyConfigList` 组件的每个属性行中，SHALL 新增 alias 输入框，与 description 输入框并排显示。

#### Scenario: 并排布局

- **WHEN** 展示默认属性配置行时
- **THEN** 每行 SHALL 显示：`[属性名 w-28]` `[alias input 固定宽度]` `[description textarea flex-1]`
- **AND** alias 输入框 SHALL 为单行 `<input type="text">`
- **AND** alias 输入框 placeholder SHALL 为 `"Alias…"`

#### Scenario: alias 自动保存

- **WHEN** 用户修改 alias 输入框时（onChange 事件）
- **THEN** 系统 SHALL 立即调用 `setAlias` 保存到 localStorage

---

### Requirement: 侧边栏默认属性 label 替换

在 issue 详情侧边栏，当属性配置了非空 alias 时，SHALL 用 alias 替换该属性的默认 label 文字。

#### Scenario: alias 替换默认 label

- **WHEN** issue.type_id 不为 null
- **AND** 当前 issue type 的该属性已配置非空 alias
- **THEN** `SidebarPropertyListItem` 的 label prop SHALL 显示 alias 文字，而非 i18n 默认文字

#### Scenario: 未配置 alias 时显示默认 label

- **WHEN** issue.type_id 为 null，或该属性 alias 为空字符串
- **THEN** `SidebarPropertyListItem` 的 label prop SHALL 显示 i18n 默认文字（如 `t("common.priority")`）

#### Scenario: alias 与 description 同时作用

- **WHEN** 同一属性同时配置了 alias 和 description
- **THEN** label 显示 alias 文字，且 ℹ️ 图标也正常显示

---

### Requirement: Peek Overview 属性面板 label 替换

在 peek-overview 的属性面板（`properties.tsx`）中，alias 替换 label 的行为 SHALL 与侧边栏一致。

#### Scenario: alias 替换 peek-overview label

- **WHEN** peek-overview 的属性面板渲染某个默认属性
- **AND** 该属性已配置非空 alias
- **THEN** 属性 label SHALL 显示 alias 文字

---

### Requirement: 创建表单 title/description 字段 alias 替换

在创建表单（`issue-modal/form.tsx`）中，当 work item type 已配置 title 或 description 的 alias 时，SHALL 用 alias 替换对应字段的标签文字。

#### Scenario: title 字段 alias 替换

- **WHEN** 当前选中的 work item type 为 "title" 属性配置了非空 alias
- **THEN** title 输入框上方的标签 SHALL 显示 alias 文字，而非 `t("title")`

#### Scenario: description 字段 alias 替换

- **WHEN** 当前选中的 work item type 为 "description" 属性配置了非空 alias
- **THEN** description 编辑器上方的标签 SHALL 显示 alias 文字，而非 `t("description")`

#### Scenario: type_id 为 null 时不替换

- **WHEN** 创建表单尚未选择 work item type（type_id 为 null）
- **THEN** title 和 description 标签 SHALL 显示默认 i18n 文字

---

### Requirement: 全屏详情与 Peek Overview 主内容区 label 行

在 issue 全屏详情（`main-content.tsx`）和 peek-overview 主内容区（`peek-overview/issue-detail.tsx`），SHALL 在 title 和 description 字段上方新增条件性 label 行。

#### Scenario: label 行在配置时显示

- **WHEN** issue.type_id 不为 null
- **AND** 该 issue type 的 "title" 或 "description" 属性已配置非空 alias 或 description
- **THEN** 对应字段上方 SHALL 显示 label 行，内容为 `alias || t("common.title")` / `alias || t("description")`
- **AND** 若该属性同时有 description，label 行末尾 SHALL 显示 ℹ️ 图标

#### Scenario: ℹ️ 图标随 label 行移动

- **WHEN** label 行已显示（alias 或 description 已配置）
- **THEN** ℹ️ 图标 SHALL 在 label 行内显示，不再在旧位置（title 右侧 / description 下方 reaction 旁）显示

#### Scenario: 均未配置时无变化

- **WHEN** issue.type_id 为 null，或 alias 和 description 均为空
- **THEN** label 行 SHALL NOT 渲染，界面与变更前完全一致
