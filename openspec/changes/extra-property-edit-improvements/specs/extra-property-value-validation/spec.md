## ADDED Requirements

### Requirement: 控件挂载时自动校验并清除不合法值

`ExtraPropertyControl` 组件挂载时，系统 SHALL 检查当前存储值是否符合属性类型的格式约束。若不合法，SHALL 立即调用 `onChange(null)` 清空该值。

校验规则：

- `text / textarea`：值必须为 `string | null`，否则不合法
- `checkbox`：值必须为 `boolean | null`，否则不合法
- `select`：值必须为 `null`，或为存在于 `config.options` 中的字符串
- `multiselect`：值必须为 `null`、空数组，或每个元素均存在于 `config.options`；不合法元素过滤后若仍有合法值则保留过滤结果，若全部不合法则清空为 `null`

**仅在 `!disabled` 时执行校验**，只读模式不自动清除。

#### Scenario: select 存储了不在选项列表中的值时自动清除

- **WHEN** 控件挂载时，select 类型属性的存储值 `"old_option"` 不在当前 `config.options` 中
- **THEN** 系统调用 `onChange(null)` 清空该值
- **THEN** 控件显示占位文字（如 "Select..."）

#### Scenario: multiselect 部分值不合法时过滤保留合法值

- **WHEN** 控件挂载时，multiselect 属性存储值为 `["valid", "deleted_option"]`，且 `"deleted_option"` 不在 `config.options` 中
- **THEN** 系统调用 `onChange(["valid"])` 保留合法元素

#### Scenario: multiselect 全部值不合法时清空

- **WHEN** 控件挂载时，multiselect 属性存储值为 `["deleted1", "deleted2"]`，且均不在 `config.options` 中
- **THEN** 系统调用 `onChange(null)` 清空

#### Scenario: text 类型值合法时不触发清除

- **WHEN** 控件挂载时，text 属性存储值为合法字符串 `"some text"`
- **THEN** 系统不调用 `onChange`，值保持不变

#### Scenario: disabled 模式下不执行校验

- **WHEN** 控件挂载时处于 `disabled` 状态（只读）
- **THEN** 即使存储值不合法，系统也不调用 `onChange`，值保持不变

---

### Requirement: 校验仅在组件挂载时执行一次

系统 SHALL 仅在 `ExtraPropertyControl` 首次挂载时（mount）执行一次合法性校验，不在每次渲染或 `value` 更新时重复执行。

#### Scenario: 值更新后不重复触发校验

- **WHEN** 用户在 select 控件中选择了新的合法值
- **THEN** 系统不会再次触发校验逻辑（不产生额外的 onChange 调用）
