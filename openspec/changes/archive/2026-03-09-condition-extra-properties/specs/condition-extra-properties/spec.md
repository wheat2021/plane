## ADDED Requirements

### Requirement: Condition property 在 sidebar 中条件显示

Issue detail sidebar（创建/编辑视图）中，condition binding 对应的属性 SHALL 仅在父属性当前值匹配触发选项时显示并可编辑。

#### Scenario: 父属性值匹配触发选项时显示 condition property

- **WHEN** issue 的 extra_properties 中父属性（select 类型）的值为 "B"
- **AND** 父属性 config 的选项 "B" 配置了 extra_input 指向属性 X
- **THEN** 属性 X SHALL 在 sidebar 中显示并可编辑

#### Scenario: 父属性值不匹配时隐藏 condition property

- **WHEN** issue 的 extra_properties 中父属性的值为 "A"
- **AND** 选项 "A" 未配置 extra_input
- **THEN** 属性 X SHALL 不在 sidebar 中显示

#### Scenario: 父属性未设置值时隐藏 condition property

- **WHEN** issue 的 extra_properties 中父属性的值为 null
- **THEN** 所有该父属性的 condition property SHALL 不显示

#### Scenario: Checkbox 父属性为 true 时显示 true_extra_input

- **WHEN** issue 的 extra_properties 中父属性（checkbox 类型）的值为 true
- **AND** 父属性 config 配置了 true_extra_input 指向属性 Z
- **THEN** 属性 Z SHALL 在 sidebar 中显示并可编辑

#### Scenario: Checkbox 父属性为 false 时显示 false_extra_input

- **WHEN** issue 的 extra_properties 中父属性（checkbox 类型）的值为 false
- **AND** 父属性 config 配置了 false_extra_input 指向属性 W
- **THEN** 属性 W SHALL 在 sidebar 中显示并可编辑

#### Scenario: 多个选项关联同一个 condition property

- **WHEN** 父属性的选项 "B" 和 "C" 都配置了 extra_input 指向属性 X
- **AND** 父属性当前值为 "B" 或 "C"
- **THEN** 属性 X SHALL 显示

### Requirement: 嵌套链条件递归检查

嵌套的 condition property（A→B→C）SHALL 递归检查整条链的条件是否满足。

#### Scenario: 嵌套链全部满足时显示

- **WHEN** 属性 A 的值匹配触发属性 B 的选项
- **AND** 属性 B 的值匹配触发属性 C 的选项
- **THEN** 属性 C SHALL 在 sidebar 中显示

#### Scenario: 嵌套链中间断裂时隐藏

- **WHEN** 属性 A 的值匹配触发属性 B 的选项
- **AND** 属性 B 的值不匹配触发属性 C 的任何选项
- **THEN** 属性 C SHALL 不显示

#### Scenario: 嵌套链根部不满足时整条链隐藏

- **WHEN** 属性 A 的值不匹配触发属性 B 的任何选项
- **THEN** 属性 B 和属性 C SHALL 都不显示

### Requirement: 父选项切换时保留 condition property 的已有值

切换父属性的选项值时，系统 SHALL NOT 清空 condition property 在 issue.extra_properties 中的已有值。

#### Scenario: 切换后再切回值仍在

- **WHEN** 用户将父属性从 "B" 切换为 "A"（属性 X 隐藏）
- **AND** 用户再将父属性切回 "B"（属性 X 重新显示）
- **THEN** 属性 X SHALL 显示之前填写的值

### Requirement: Condition property 的 is_required 行为

当 condition property 可见时，其 is_required 状态 SHALL 由 workspace config 中 extra_input.required 字段决定。

#### Scenario: extra_input.required 为 true 时必填

- **WHEN** condition property 可见
- **AND** 对应的 extra_input.required 为 true
- **THEN** 该属性 SHALL 显示必填标识，空值 SHALL 触发验证错误

#### Scenario: extra_input.required 为 false 时可选

- **WHEN** condition property 可见
- **AND** 对应的 extra_input.required 为 false
- **THEN** 该属性 SHALL 允许空值

### Requirement: 循环引用检测

保存 ExtraPropertyConfig 的 extra_input 配置时，系统 SHALL 检测循环引用并拒绝保存。

#### Scenario: 直接循环被拒绝

- **WHEN** 属性 A 的选项配置 extra_input 指向属性 B
- **AND** 属性 B 的选项配置 extra_input 指向属性 A
- **THEN** 后保存的那个 SHALL 返回 HTTP 400，错误信息包含循环路径

#### Scenario: 间接循环被拒绝

- **WHEN** 属性 A → B → C → A 形成间接循环
- **THEN** 最后一个形成环的保存 SHALL 返回 HTTP 400

#### Scenario: 合法嵌套链允许保存

- **WHEN** 属性 A → B → C 形成链式关系，无环
- **THEN** 保存 SHALL 成功

### Requirement: 自动 condition binding 创建

绑定含 extra_input 的父属性到 issue type 时，系统 SHALL 自动创建 condition binding。

#### Scenario: 绑定父属性时自动创建 condition binding

- **WHEN** 管理员将含 extra_input 的属性"类别"绑定到某 issue type
- **AND** "类别"的选项 "B" 配置了 extra_input 指向属性 X
- **THEN** 系统 SHALL 自动创建属性 X 的 IssueTypeExtraProperty 记录
- **AND** 该记录的 condition_config SHALL 指向"类别"的 ExtraPropertyConfig
- **AND** sort_order SHALL 默认为父属性 sort_order 之后

#### Scenario: 递归创建嵌套 condition binding

- **WHEN** 属性 X 本身也有选项配置了 extra_input 指向属性 Y
- **THEN** 系统 SHALL 递归创建属性 Y 的 condition binding
- **AND** 属性 Y 的 condition_config SHALL 指向属性 X 的 ExtraPropertyConfig

#### Scenario: 已存在的 condition binding 不重复创建

- **WHEN** 属性 X 的 condition binding 已存在（由另一个父属性触发）
- **THEN** 系统 SHALL NOT 创建重复的 binding 记录

### Requirement: Workspace config 变更时自动同步 condition binding

更新 ExtraPropertyConfig 的 extra_input 配置时，系统 SHALL 同步更新所有已绑定该 config 的 project+issueType 的 condition binding。

#### Scenario: 新增 extra_input 时创建 condition binding

- **WHEN** 管理员为"类别"的选项 "C" 新增 extra_input 指向属性 Y
- **AND** "类别"已绑定到 project P 的 issue type T
- **THEN** 系统 SHALL 在 P+T 中自动创建属性 Y 的 condition binding

#### Scenario: 移除 extra_input 时删除 condition binding

- **WHEN** 管理员移除"类别"选项 "B" 的 extra_input（原指向属性 X）
- **AND** 属性 X 不再被"类别"的任何其他选项关联
- **THEN** 系统 SHALL 删除属性 X 在所有 P+T 中由"类别"触发的 condition binding

#### Scenario: 移除 extra_input 时级联删除嵌套 condition binding

- **WHEN** 被删除的 condition binding（属性 X）本身也是其他 condition binding 的父属性
- **THEN** 系统 SHALL 递归删除这些嵌套的 condition binding

### Requirement: 解绑父属性时级联删除 condition binding

解绑父属性时，系统 SHALL 级联删除所有由该父属性触发的 condition binding。

#### Scenario: 解绑父属性级联删除

- **WHEN** 管理员解绑"类别"属性
- **THEN** 所有 condition_config 指向"类别"config 的 binding SHALL 被删除
- **AND** 如果被删除的 binding 也是其他 condition binding 的父属性，SHALL 递归删除

### Requirement: Condition binding 不可手动解绑

Condition binding（condition_config 不为 null 的 binding）SHALL NOT 允许通过 API 或 UI 手动删除。

#### Scenario: API 拒绝手动删除 condition binding

- **WHEN** 用户调用 DELETE API 删除一个 condition binding
- **THEN** 系统 SHALL 返回 HTTP 400，提示该 binding 由父属性控制

#### Scenario: UI 中 condition binding 无解绑操作

- **WHEN** binding list 显示 condition binding
- **THEN** SHALL NOT 显示解绑 checkbox 或删除按钮
