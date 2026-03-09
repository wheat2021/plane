## MODIFIED Requirements

### Requirement: ExtraPropertyConfig model scope

Previously: ExtraPropertyConfig is scoped to workspace level only, without binding to a specific IssueType. The unique constraint SHALL be `(workspace, key)`. The `required` field SHALL be removed from this model — required status is now managed at the binding level via `IssueTypeExtraProperty.is_required`.

The ExtraPropertyConfig model SHALL be scoped to workspace level only. The unique constraint SHALL be `(workspace, key)`. The `config` JSONField SHALL support `extra_input` in option structures for select/multiselect types, and `true_extra_input`/`false_extra_input` for checkbox types.

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
  }
}
```

`extra_input` 为 null 或不存在表示该选项不关联额外属性。`extra_input.config` SHALL 引用同一 workspace 内已存在的 ExtraPropertyConfig。

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

### Requirement: Serializer removes issue_type handling

Previously: The ExtraPropertyConfigSerializer SHALL no longer accept or return `issue_type` / `issue_type_id` fields. The serializer SHALL set `workspace_id` from URL context only. The serializer SHALL NOT include `required` in output or accept it in input.

The ExtraPropertyConfigSerializer SHALL no longer accept or return `issue_type` / `issue_type_id` fields. The serializer SHALL set `workspace_id` from URL context only. The serializer SHALL NOT include `required` in output or accept it in input. The serializer SHALL validate `extra_input` references in options and checkbox config, ensuring referenced configs exist in the same workspace.

#### Scenario: Serialization output

- **WHEN** an ExtraPropertyConfig is serialized
- **THEN** the response SHALL include id, workspace, key, label, type, description, sort_order, and flattened config fields (options with extra_input, default_value, true_value, false_value, true_extra_input, false_extra_input) but NOT issue_type and NOT required

#### Scenario: Validation of extra_input references

- **WHEN** a create or update request includes options with extra_input
- **THEN** the serializer SHALL validate that each extra_input.config references a valid ExtraPropertyConfig in the same workspace

### Requirement: Frontend store adapts to workspace scope

Previously: The ExtraPropertyConfigStore SHALL index configs at workspace level. The `required` property SHALL NOT be present on config objects in the store.

The ExtraPropertyConfigStore SHALL index configs at workspace level. The `required` property SHALL NOT be present on config objects in the store. The store SHALL expose helper methods to extract extra_input relationships from config options.

#### Scenario: Fetch all workspace configs

- **WHEN** `fetchWorkspaceConfigs(workspaceSlug)` is called
- **THEN** the store SHALL fetch all configs from `GET /workspaces/<slug>/extra-properties/` and populate `configMap`
- **THEN** config objects in the store SHALL NOT contain a `required` field

#### Scenario: Get config by ID

- **WHEN** `getConfigById(id)` is called
- **THEN** the store SHALL return the config from `configMap` regardless of issue type

#### Scenario: 获取 config 的所有 extra_input 关联

- **WHEN** `getExtraInputConfigs(configId)` is called
- **THEN** SHALL 返回该 config 的所有 option/checkbox 状态关联的 extra_input config ID 集合

#### Scenario: 获取触发某个 extra_input 的选项值集合

- **WHEN** `getTriggerValues(parentConfigId, childConfigId)` is called
- **THEN** SHALL 返回父属性中所有 extra_input.config 匹配 childConfigId 的选项 value 集合（含 checkbox 的 true/false）

### Requirement: Frontend service adapts to new API paths

Previously: The ExtraPropertyConfigService SHALL use workspace-scoped API paths. The service SHALL NOT send `required` in create or update payloads.

The ExtraPropertyConfigService SHALL use workspace-scoped API paths. The service SHALL NOT send `required` in create or update payloads. The service SHALL support sending options with `extra_input` in create and update payloads.

#### Scenario: Service method signatures

- **WHEN** service methods are called
- **THEN** `getConfigs(workspaceSlug)`, `createConfig(workspaceSlug, data)`, `updateConfig(workspaceSlug, configId, data)`, `deleteConfig(workspaceSlug, configId)` SHALL use `/workspaces/<slug>/extra-properties/` paths and SHALL NOT include `required` in request/response types
- **AND** create/update payloads SHALL support options with `extra_input` field
