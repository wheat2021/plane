## MODIFIED Requirements

### Requirement: Create new extra property

Previously: The admin SHALL be able to create a new ExtraPropertyConfig through a form on the settings page. The form SHALL NOT include a required toggle. The available property types SHALL be: text, textarea, select, multiselect, checkbox. 描述字段 SHALL 使用受控输入模式（`Controller`）。

The admin SHALL be able to create a new ExtraPropertyConfig through a form on the settings page. The form SHALL NOT include a required toggle. The available property types SHALL be: text, textarea, select, multiselect, checkbox. 描述字段 SHALL 使用受控输入模式（`Controller`）。Select/Multiselect 的选项编辑器 SHALL 支持为每个选项配置 extra input（关联另一个 ExtraPropertyConfig）。Checkbox 类型 SHALL 支持为 true/false 状态各配置一个 extra input。

#### Scenario: Create text property

- **WHEN** the admin fills in label, key, selects type "text", and submits
- **THEN** the system SHALL create the property via `POST /workspaces/<slug>/extra-properties/` and display it in the list
- **THEN** the create form SHALL NOT include a required field

#### Scenario: Markdown type not available

- **WHEN** the admin opens the type selector in the create form
- **THEN** "Markdown" SHALL NOT appear as an available type option

#### Scenario: Description field is editable

- **WHEN** the admin clicks into the description textarea in the create or edit form
- **THEN** the field SHALL accept keyboard input and reflect typed content in real time

#### Scenario: Create select property with options and annotations

- **WHEN** the admin selects type "select" or "multiselect"
- **THEN** the form SHALL display an options editor with two columns: "值"（value）and "注释"（annotation/label）
- **THEN** the second column SHALL be labeled "注释" in placeholder text

#### Scenario: Select 选项配置 extra input

- **WHEN** 管理员在 select/multiselect 的选项编辑器中
- **THEN** 每个选项行 SHALL 显示一个可选的 "Extra Input" 下拉选择器
- **AND** 下拉选择器 SHALL 列出同一 workspace 中的其他 ExtraPropertyConfig（排除自身和会形成循环的 config）
- **AND** 选择后 SHALL 显示一个 "必填" 开关（默认关闭）

#### Scenario: Checkbox 配置 extra input

- **WHEN** 管理员选择 checkbox 类型
- **THEN** 表单 SHALL 在 true_value/false_value 输入框旁各显示一个可选的 "Extra Input" 下拉选择器
- **AND** 选择后 SHALL 显示一个 "必填" 开关（默认关闭）

#### Scenario: Extra input 循环引用提示

- **WHEN** 管理员选择的 extra input config 会形成循环引用
- **THEN** 该选项 SHALL 在下拉列表中被禁用或不显示
- **AND** 如果后端检测到循环，保存时 SHALL 显示错误提示

#### Scenario: Duplicate key rejected

- **WHEN** the admin attempts to create a property with a key that already exists in the workspace
- **THEN** the system SHALL display a validation error indicating the key must be unique

#### Scenario: Invalid key format rejected

- **WHEN** the admin enters a key that does not match `^[a-zA-Z][a-zA-Z0-9_]*$`
- **THEN** the system SHALL display a validation error

### Requirement: Edit existing extra property

Previously: The admin SHALL be able to edit label, description, sort_order, and type-specific config (options, default_value, true/false_value) of an existing property. The required flag and type field SHALL NOT be editable on this page.

The admin SHALL be able to edit label, description, sort_order, and type-specific config (options with extra_input, default_value, true/false_value with extra_input) of an existing property. The required flag and type field SHALL NOT be editable on this page. 编辑 extra_input 配置后保存时，系统 SHALL 自动同步所有已绑定的 project+issueType 的 condition binding。

#### Scenario: Edit property label

- **WHEN** the admin changes the label of an existing property and saves
- **THEN** the system SHALL update via `PATCH /workspaces/<slug>/extra-properties/<id>/` and reflect the change

#### Scenario: Key is not editable after creation

- **WHEN** the admin views an existing property in edit mode
- **THEN** the key field SHALL be read-only

#### Scenario: Type is not editable after creation

- **WHEN** the admin views an existing property in edit mode
- **THEN** the type field SHALL be read-only to prevent data incompatibility

#### Scenario: Required is not editable on this page

- **WHEN** the admin views an existing property in edit mode
- **THEN** the required toggle SHALL NOT be present in the form

#### Scenario: 编辑 select 选项的 extra input

- **WHEN** 管理员编辑 select/multiselect 属性的选项
- **THEN** 每个选项行 SHALL 显示当前配置的 extra input（如有）
- **AND** 管理员可以添加、修改或移除 extra input 配置

#### Scenario: 编辑 checkbox 的 extra input

- **WHEN** 管理员编辑 checkbox 属性
- **THEN** true/false 状态的 extra input 配置 SHALL 可编辑

#### Scenario: 保存后自动同步 condition binding

- **WHEN** 管理员修改了 extra_input 配置并保存
- **THEN** 系统 SHALL 自动同步所有已绑定该 config 的 project+issueType 的 condition binding
