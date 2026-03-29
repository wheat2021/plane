## ADDED Requirements

### Requirement: 分组选项包含当前项目的 select 类型 extra property

在 list/kanban 视图的「分组方式」选择器中，SHALL 在默认属性选项之后，展示当前项目中已绑定到至少一个 issue type 的所有 `select` 类型 extra property，作为可选分组字段。

#### Scenario: 项目有 select 类型 extra property 时显示分组选项

- **WHEN** 用户打开 list/kanban 视图的「分组方式」面板
- **THEN** 面板中 SHALL 显示该项目所有 select 类型 extra property 的标签名称作为可选项，位于默认分组选项之后

#### Scenario: 项目无 select 类型 extra property 时不显示额外选项

- **WHEN** 当前项目没有任何 select 类型 extra property 绑定
- **THEN** 「分组方式」面板 SHALL 仅显示默认属性选项，无额外区块

#### Scenario: 选择 extra property 作为分组字段

- **WHEN** 用户选择某个 select 类型 extra property 作为分组方式
- **THEN** 系统 SHALL 以 `extra_property:{key}` 格式存储 `group_by` 并触发重新拉取分组数据

---

### Requirement: 按 extra property 分组时展示三类分组列

按 select 类型 extra property 分组时，视图 SHALL 展示以下三类分组列：

1. **选项列**：该属性每个选项值对应一列
2. **未设置列**（id = `"None"`）：issue 类型绑定了该属性但未填写值
3. **不适用列**（id = `"__none_unsupported__"`）：issue 类型未绑定该属性，或 issue 无 type

#### Scenario: 有值的工作项出现在对应选项列

- **WHEN** 工作项的 extra_properties 中该属性有值（如 `"severity": "high"`）
- **THEN** 该工作项 SHALL 出现在 id 为 `"high"` 的选项列中

#### Scenario: 属于该类型但未设置值的工作项出现在「未设置」列

- **WHEN** 工作项的 issue type 绑定了该 extra property，但 extra_properties 中该键缺失或为 null
- **THEN** 该工作项 SHALL 出现在「未设置」列（`"None"`）

#### Scenario: 不支持该属性的工作项出现在「不适用」列

- **WHEN** 工作项的 issue type 未绑定该 extra property，或工作项无 issue type
- **THEN** 该工作项 SHALL 出现在「不适用」列（`"__none_unsupported__"`）

#### Scenario: 无工作项的选项列仍然显示

- **WHEN** 某选项值在当前过滤条件下没有任何工作项
- **THEN** 该选项列 SHALL 仍然在视图中显示（total_results = 0）

---

### Requirement: 拖拽工作项到选项列更新 extra property 值

用户可通过拖拽将工作项从一列移至另一列，系统 SHALL 更新该工作项的 extra property 值。

#### Scenario: 拖拽到选项列设置对应值

- **WHEN** 用户将工作项拖拽到某个选项列（如 `"high"`）
- **THEN** 系统 SHALL 将该工作项的 `extra_properties[key]` 更新为目标选项值，并通过 `updateIssue` API 保存

#### Scenario: 拖拽到「未设置」列清空值

- **WHEN** 用户将工作项拖拽到「未设置」列（`"None"`）
- **THEN** 系统 SHALL 将 `extra_properties[key]` 设置为 `null`，并通过 `updateIssue` API 保存

#### Scenario: 「不适用」列禁止拖入

- **WHEN** 用户尝试将工作项拖入「不适用」列（`"__none_unsupported__"`）
- **THEN** 系统 SHALL 拒绝拖入操作，显示提示信息：「此工作项类型不支持该属性」

---

### Requirement: 后端按 extra property JSONB 字段分组

后端 SHALL 支持 `group_by=extra_property:{key}` 格式的分组参数，通过 PostgreSQL JSONB 字段查询实现分组。

#### Scenario: 后端正确解析 extra_property 分组参数

- **WHEN** API 请求包含 `group_by=extra_property:severity`
- **THEN** 后端 SHALL 将 `extra_properties->>'severity'` 作为分组依据，返回按该值分桶的响应

#### Scenario: 双 None 区分通过 IssueTypeExtraProperty 绑定判断

- **WHEN** 分组字段为 `extra_property:{key}`，且项目中存在对该属性有绑定和无绑定的 issue type
- **THEN** 无绑定 issue type 的工作项 SHALL 被归入 `"__none_unsupported__"` 分组，有绑定但无值的归入 `"None"` 分组

#### Scenario: group_by_fields 包含双 None sentinel

- **WHEN** 调用 `issue_group_values(field="extra_property:severity", ...)`
- **THEN** 返回值 SHALL 包含该属性所有 option 值 + `"None"` + `"__none_unsupported__"`

#### Scenario: API 响应不包含内部 annotation 字段

- **WHEN** 按 extra property 分组时，后端在 QuerySet 上添加 `ep__severity` annotation
- **THEN** 最终返回给前端的 issue 对象 SHALL 不包含 `ep__` 开头的字段

---

### Requirement: filter store 校验防止无效分组持久化

SHALL 在 filter store 初始化时校验 `group_by` 的合法性。

#### Scenario: 切换到不支持该属性的项目时重置分组

- **WHEN** localStorage 中存储了 `group_by=extra_property:severity`，但当前项目无 `severity` 属性绑定
- **THEN** filter store SHALL 将 `group_by` 重置为 `null`，并使用默认分组展示
