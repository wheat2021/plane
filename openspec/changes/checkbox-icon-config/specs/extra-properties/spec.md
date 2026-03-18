## MODIFIED Requirements

### Requirement: ExtraPropertyConfig model scope

The ExtraPropertyConfig model SHALL be scoped to workspace level only. The unique constraint SHALL be `(workspace, key)`. The `config` JSONField SHALL support `extra_input` in option structures for select/multiselect types, and `true_extra_input`/`false_extra_input` for checkbox types. The `config` JSONField SHALL additionally support `true_icon`、`true_icon_color`、`false_icon`、`false_icon_color` for checkbox types.

Select/Multiselect option 结构扩展：

```json
{
  "value": "string",
  "label": "string (optional)",
  "isDefault": "boolean (optional)",
  "extra_input": {
    "config": "ExtraPropertyConfig UUID",
    "required": "boolean (default false)"
  }
}
```

Checkbox config 扩展：

```json
{
  "true_value": "string",
  "false_value": "string",
  "true_extra_input": {
    "config": "ExtraPropertyConfig UUID",
    "required": "boolean (default false)"
  },
  "false_extra_input": {
    "config": "ExtraPropertyConfig UUID",
    "required": "boolean (default false)"
  },
  "true_icon": "string (lucide icon name, optional)",
  "true_icon_color": "string (hex color, optional)",
  "false_icon": "string (lucide icon name, optional)",
  "false_icon_color": "string (hex color, optional)"
}
```

`extra_input` 为 null 或不存在表示该选项不关联额外属性。`extra_input.config` SHALL 引用同一 workspace 内已存在的 ExtraPropertyConfig。图标字段均为可选，不存在时使用默认图标渲染。

#### Scenario: Create workspace-scoped property

- **WHEN** a new ExtraPropertyConfig is created
- **THEN** it SHALL only require `workspace`, `key`, `label`, and `type` fields (no `issue_type`, no `required`)

#### Scenario: Key uniqueness within workspace

- **WHEN** a property with key "priority_score" exists in workspace W
- **THEN** creating another property with key "priority_score" in workspace W SHALL be rejected
- **THEN** creating a property with key "priority_score" in a different workspace SHALL succeed

#### Scenario: Select option with extra_input

- **WHEN** a select property is created or updated with an option containing `extra_input`
- **THEN** `extra_input.config` SHALL reference a valid ExtraPropertyConfig in the same workspace
- **AND** `extra_input.required` SHALL default to false if not provided

#### Scenario: Checkbox with true_extra_input and false_extra_input

- **WHEN** a checkbox property is created or updated with `true_extra_input` or `false_extra_input`
- **THEN** the referenced config SHALL exist in the same workspace
- **AND** `required` SHALL default to false if not provided

#### Scenario: extra_input 引用不存在的 config 被拒绝

- **WHEN** extra_input.config 引用了不存在或不属于同一 workspace 的 ExtraPropertyConfig
- **THEN** 系统 SHALL 返回 HTTP 400 验证错误

#### Scenario: Checkbox 图标字段写入和读取

- **WHEN** checkbox 属性创建或更新时包含 `true_icon`、`true_icon_color`、`false_icon`、`false_icon_color`
- **THEN** 这四个字段 SHALL 被持久化到 config JSONField
- **AND** 序列化输出 SHALL 包含这四个字段（有值时输出，无值时输出 null 或不包含）

### Requirement: Serializer removes issue_type handling

The ExtraPropertyConfigSerializer SHALL no longer accept or return `issue_type` / `issue_type_id` fields. The serializer SHALL set `workspace_id` from URL context only. The serializer SHALL NOT include `required` in output or accept it in input. The serializer SHALL validate `extra_input` references in options and checkbox config, ensuring referenced configs exist in the same workspace. The serializer SHALL accept and return `true_icon`、`true_icon_color`、`false_icon`、`false_icon_color` as optional fields for checkbox type.

#### Scenario: Serialization output

- **WHEN** an ExtraPropertyConfig is serialized
- **THEN** the response SHALL include id, workspace, key, label, type, description, sort_order, and flattened config fields (options with extra_input, default_value, true_value, false_value, true_extra_input, false_extra_input, true_icon, true_icon_color, false_icon, false_icon_color) but NOT issue_type and NOT required

#### Scenario: Validation of extra_input references

- **WHEN** a create or update request includes options with extra_input
- **THEN** the serializer SHALL validate that each extra_input.config references a valid ExtraPropertyConfig in the same workspace
