## ADDED Requirements

### Requirement: 筛选器面板展示 Extra Properties 选项

工作项列表及 Views 的筛选器面板 SHALL 动态列出当前项目可用的 Extra Properties 作为筛选维度，与标准属性（state、priority 等）并列显示。

#### Scenario: 项目有可用 Extra Properties 时筛选器中显示

- **WHEN** 用户打开 Views 或工作项列表的筛选器面板
- **AND** 当前项目已绑定至少一个 `option` 或 `multi_option` 类型的 Extra Property
- **THEN** 筛选器列表 SHALL 包含这些 Extra Properties 的筛选选项
- **AND** 每个选项 SHALL 显示该 Extra Property 的名称（`label` 字段）

#### Scenario: 项目无可用 Extra Properties 时筛选器不显示

- **WHEN** 用户打开筛选器面板
- **AND** 当前项目未绑定任何 `option` 或 `multi_option` 类型的 Extra Property
- **THEN** 筛选器列表中 SHALL NOT 出现 Extra Property 相关筛选选项

#### Scenario: Extra Property 数据未加载时筛选器不显示

- **WHEN** Extra Property 配置数据尚未从 API 加载完成
- **THEN** Extra Property 筛选选项 SHALL NOT 出现在筛选器列表中

---

### Requirement: 用户可按 Extra Property 的选项值筛选工作项

对于 `option` 和 `multi_option` 类型的 Extra Property，用户 SHALL 能够选择一个或多个选项值作为筛选条件。

#### Scenario: 展开 Extra Property 筛选器显示可选选项

- **WHEN** 用户点击某个 Extra Property 筛选维度
- **THEN** 系统 SHALL 展示该 Extra Property 配置的所有选项（`options` 字段）
- **AND** 每个选项 SHALL 显示选项的名称

#### Scenario: 选择选项值后工作项列表实时更新

- **WHEN** 用户选择一个或多个 Extra Property 选项值
- **THEN** 工作项列表 SHALL 立即更新为仅显示该 Extra Property 包含所选选项值的工作项
- **AND** 不含该 Extra Property 或值不匹配的工作项 SHALL 从列表中移除

#### Scenario: 多个 Extra Property 条件之间为 AND 逻辑

- **WHEN** 用户同时为两个或更多 Extra Properties 设置了筛选条件
- **THEN** 工作项列表 SHALL 仅显示同时满足所有 Extra Property 条件的工作项

#### Scenario: Extra Property 筛选与标准属性筛选可组合使用

- **WHEN** 用户同时设置了 Extra Property 筛选条件和标准属性筛选条件（如 state、priority）
- **THEN** 工作项列表 SHALL 仅显示同时满足所有条件的工作项

---

### Requirement: Extra Property 筛选条件可保存至 View

用户在 View 表单中设置的 Extra Property 筛选条件 SHALL 能够随 View 一同保存并在下次打开时恢复。

#### Scenario: 保存包含 Extra Property 筛选的 View

- **WHEN** 用户在 View 创建/编辑表单中设置了 Extra Property 筛选条件
- **AND** 用户保存该 View
- **THEN** Extra Property 筛选条件 SHALL 被持久化到 View 的 `rich_filters` 字段中

#### Scenario: 打开已保存 View 时自动恢复 Extra Property 筛选

- **WHEN** 用户打开一个保存了 Extra Property 筛选条件的 View
- **THEN** 系统 SHALL 自动应用该筛选条件
- **AND** 工作项列表 SHALL 按保存的 Extra Property 条件过滤

#### Scenario: 清除 Extra Property 筛选条件

- **WHEN** 用户点击已应用的 Extra Property 筛选标签的关闭按钮
- **THEN** 该筛选条件 SHALL 被移除
- **AND** 工作项列表 SHALL 不再按该 Extra Property 条件过滤

---

### Requirement: Extra Property 筛选条件的 Filter Key 格式

系统 SHALL 使用 `extra_property_<configId>` 作为 Rich Filter 表达式中 Extra Property 筛选条件的 property key，以区别于标准属性 key。

#### Scenario: Filter 表达式中 Extra Property 条件的格式

- **WHEN** 用户为 configId 为 `abc123` 的 Extra Property 选择选项值 `opt1` 和 `opt2`
- **THEN** Rich Filter 表达式 SHALL 包含条件 `{ "extra_property_abc123__in": ["opt1", "opt2"] }`

#### Scenario: 后端正确解析并执行 Extra Property 筛选条件

- **WHEN** 后端接收到包含 `extra_property_<configId>__in` 条件的 `rich_filters`
- **THEN** 后端 SHALL 识别该条件为 Extra Property 筛选
- **AND** 后端 SHALL 仅返回该 Extra Property 值在给定选项集合内的工作项
- **AND** 不含该 Extra Property 的工作项 SHALL 被从结果中排除
