## MODIFIED Requirements

### Requirement: ExtraPropertyConfig model scope

Previously: ExtraPropertyConfig is scoped to workspace level only, without binding to a specific IssueType. The `issue_type` FK SHALL be removed. The unique constraint SHALL change from `(issue_type, key)` to `(workspace, key)`.

The ExtraPropertyConfig model SHALL be scoped to workspace level only, without binding to a specific IssueType. The unique constraint SHALL be `(workspace, key)`. The `required` field SHALL be removed from this model — required status is now managed at the binding level via `IssueTypeExtraProperty.is_required`.

#### Scenario: Create workspace-scoped property

- **WHEN** a new ExtraPropertyConfig is created
- **THEN** it SHALL only require `workspace`, `key`, `label`, and `type` fields (no `issue_type`, no `required`)

#### Scenario: Key uniqueness within workspace

- **WHEN** a property with key "priority_score" exists in workspace W
- **THEN** creating another property with key "priority_score" in workspace W SHALL be rejected
- **THEN** creating a property with key "priority_score" in a different workspace SHALL succeed

### Requirement: Serializer removes issue_type handling

Previously: Serializer passed `issue_type_id` from URL context and included it in response. Response included required field.

The ExtraPropertyConfigSerializer SHALL no longer accept or return `issue_type` / `issue_type_id` fields. The serializer SHALL set `workspace_id` from URL context only. The serializer SHALL NOT include `required` in output or accept it in input.

#### Scenario: Serialization output

- **WHEN** an ExtraPropertyConfig is serialized
- **THEN** the response SHALL include id, workspace, key, label, type, description, sort_order, and flattened config fields (options, default_value, true_value, false_value) but NOT issue_type and NOT required

### Requirement: Frontend store adapts to workspace scope

Previously: Store indexed configs by `issueTypeId` via `issueTypeConfigsMap`. Store handled `required` field on config objects.

The ExtraPropertyConfigStore SHALL index configs at workspace level. The `required` property SHALL NOT be present on config objects in the store.

#### Scenario: Fetch all workspace configs

- **WHEN** `fetchWorkspaceConfigs(workspaceSlug)` is called
- **THEN** the store SHALL fetch all configs from `GET /workspaces/<slug>/extra-properties/` and populate `configMap`
- **THEN** config objects in the store SHALL NOT contain a `required` field

#### Scenario: Get config by ID

- **WHEN** `getConfigById(id)` is called
- **THEN** the store SHALL return the config from `configMap` regardless of issue type

### Requirement: Frontend service adapts to new API paths

Previously: Service methods used workspace-scoped API paths and handled `required` in payloads.

The ExtraPropertyConfigService SHALL use workspace-scoped API paths. The service SHALL NOT send `required` in create or update payloads.

#### Scenario: Service method signatures

- **WHEN** service methods are called
- **THEN** `getConfigs(workspaceSlug)`, `createConfig(workspaceSlug, data)`, `updateConfig(workspaceSlug, configId, data)`, `deleteConfig(workspaceSlug, configId)` SHALL use `/workspaces/<slug>/extra-properties/` paths and SHALL NOT include `required` in request/response types

## REMOVED Requirements

### Requirement: ExtraPropertyConfig required field

**Reason**: The `required` boolean field on ExtraPropertyConfig is being moved to the binding model (`IssueTypeExtraProperty.is_required`) to enable per-work-item-type required configuration.

**Migration**: All existing `ExtraPropertyConfig.required` values SHALL be migrated to corresponding `IssueTypeExtraProperty.is_required` records before the field is removed.

### Requirement: Markdown 属性类型支持

**Reason**: Markdown 类型超出当前需求范围，且与 textarea 类型功能高度重叠，维护富文本编辑器控件成本较高。线上无存量 markdown 类型属性，可直接删除。

**Migration**: 无需迁移。`TExtraPropertyType` 联合类型中删除 `"markdown"`，前端控件文件 `controls/markdown.tsx` 整体删除，`extra-property-control.tsx` 中的 `case "markdown"` 分支删除。
