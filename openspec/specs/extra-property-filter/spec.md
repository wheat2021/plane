# Extra Property Filter

## Purpose

定义 extra property 筛选功能的规格，包括筛选器面板显示、筛选条件执行、持久化和类型系统。

## Requirements

### Requirement: 筛选器面板显示 Extra Property 筛选选项

项目视图的筛选器面板 SHALL 动态展示当前项目可用的 Extra Property 作为筛选维度，包括 condition property。仅 `select`/`multiselect` 类型可筛选（无论是普通绑定还是 condition 绑定）。

#### Scenario: 显示可筛选的 Extra Property（含 condition property）

- **WHEN** 用户打开项目视图的筛选器面板
- **AND** 当前项目已绑定 `select` 或 `multiselect` 类型的 Extra Property（含 condition binding）
- **THEN** 筛选器列表 SHALL 显示这些 Extra Property 作为筛选选项
- **AND** 每个选项 SHALL 显示属性的 label

#### Scenario: 未绑定 Extra Property 时不显示

- **WHEN** 当前项目未绑定任何 `select` / `multiselect` 类型的 Extra Property
- **THEN** 筛选器列表 SHALL NOT 显示 Extra Property 相关选项

#### Scenario: 展开 Extra Property 筛选器显示选项值

- **WHEN** 用户展开某个 Extra Property 筛选器
- **THEN** SHALL 显示该属性配置中定义的所有选项值
- **AND** 用户可选择一个或多个选项值进行筛选

### Requirement: Extra Property 筛选条件执行

选择 Extra Property 筛选条件后，工作项列表 SHALL 按条件过滤。筛选基于 extra_properties JSONField 的实际存储值，不检查父选项是否匹配（condition property 的筛选与普通属性一致）。

#### Scenario: 按 Extra Property 选项值筛选

- **WHEN** 用户选择某个 Extra Property 的一个或多个选项值
- **THEN** 工作项列表 SHALL 立即更新为仅显示匹配的工作项
- **AND** 匹配逻辑为 IN（工作项的该属性值在所选值集合中）

#### Scenario: 未设置属性的工作项被排除

- **WHEN** 用户设置了 Extra Property 筛选条件
- **AND** 某工作项未设置该 Extra Property 的值
- **THEN** 该工作项 SHALL NOT 出现在筛选结果中

#### Scenario: 与标准属性筛选组合

- **WHEN** 用户同时设置 Extra Property 筛选和标准属性筛选（如 state、priority）
- **THEN** 所有筛选条件 SHALL 以 AND 逻辑组合
- **AND** 仅同时满足所有条件的工作项出现在结果中

#### Scenario: Condition property 筛选基于实际值

- **WHEN** 用户按 condition property 筛选
- **AND** 某工作项的该 condition property 有值但父选项不匹配
- **THEN** 该工作项 SHALL 出现在筛选结果中（筛选不检查条件是否满足）

### Requirement: Extra Property 筛选条件持久化

包含 Extra Property 筛选条件的视图 SHALL 支持保存和恢复。

#### Scenario: 保存包含 Extra Property 筛选的视图

- **WHEN** 用户设置了 Extra Property 筛选条件后保存视图
- **THEN** 筛选条件 SHALL 以 `extra_property_<configId>` 格式保存到视图的 `rich_filters` 字段中

#### Scenario: 恢复 Extra Property 筛选条件

- **WHEN** 用户打开一个包含 Extra Property 筛选条件的已保存视图
- **THEN** 筛选器面板 SHALL 恢复之前选择的 Extra Property 筛选条件
- **AND** 工作项列表 SHALL 自动应用该筛选

### Requirement: Filter Key 类型系统

Extra Property 筛选条件的 key SHALL 使用 `extra_property_<configId>` 格式，与现有 Rich Filter 系统集成。

#### Scenario: 类型安全的动态 key

- **WHEN** 前端代码使用 Extra Property filter key
- **THEN** TypeScript 类型系统 SHALL 通过模板字面量类型 `` `extra_property_${string}` `` 接受该 key
- **AND** 不影响现有标准属性 filter key 的类型检查

#### Scenario: 后端解析动态 filter key

- **WHEN** 后端接收到包含 `extra_property_<configId>` 格式 key 的 `rich_filters`
- **THEN** SHALL 识别前缀 `extra_property_` 并提取 configId
- **AND** 转换为对 `extra_properties` JSONField 的 ORM 查询
