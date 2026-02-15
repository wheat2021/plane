## MODIFIED Requirements

### Requirement: ExtraPropertyConfig model scope

Previously: ExtraPropertyConfig is scoped to a specific IssueType via `issue_type` FK. Unique constraint is `(issue_type, key)`.

The ExtraPropertyConfig model SHALL be scoped to workspace level only, without binding to a specific IssueType. The `issue_type` FK SHALL be removed. The unique constraint SHALL change from `(issue_type, key)` to `(workspace, key)`.

#### Scenario: Create workspace-scoped property

- **WHEN** a new ExtraPropertyConfig is created
- **THEN** it SHALL only require `workspace`, `key`, `label`, and `type` fields (no `issue_type`)

#### Scenario: Key uniqueness within workspace

- **WHEN** a property with key "priority_score" exists in workspace W
- **THEN** creating another property with key "priority_score" in workspace W SHALL be rejected
- **THEN** creating a property with key "priority_score" in a different workspace SHALL succeed

### Requirement: API endpoints use workspace scope

Previously: API paths nested under issue type (`/issue-types/<type_id>/extra-properties/`).

The Extra Property CRUD API endpoints SHALL use workspace-scoped paths without issue type nesting.

#### Scenario: List all workspace extra properties

- **WHEN** `GET /workspaces/<slug>/extra-properties/` is called
- **THEN** the response SHALL return all ExtraPropertyConfig records for the workspace, sorted by sort_order

#### Scenario: Create extra property

- **WHEN** `POST /workspaces/<slug>/extra-properties/` is called with property data
- **THEN** the system SHALL create the property scoped to the workspace (no issue_type_id needed)

#### Scenario: Update extra property

- **WHEN** `PATCH /workspaces/<slug>/extra-properties/<id>/` is called
- **THEN** the system SHALL update the property fields

#### Scenario: Delete extra property

- **WHEN** `DELETE /workspaces/<slug>/extra-properties/<id>/` is called
- **THEN** the system SHALL soft-delete the property

### Requirement: Serializer removes issue_type handling

Previously: Serializer passed `issue_type_id` from URL context and included it in response.

The ExtraPropertyConfigSerializer SHALL no longer accept or return `issue_type` / `issue_type_id` fields. The serializer SHALL set `workspace_id` from URL context only.

#### Scenario: Serialization output

- **WHEN** an ExtraPropertyConfig is serialized
- **THEN** the response SHALL include id, workspace, key, label, type, description, required, sort_order, and flattened config fields (options, default_value, true_value, false_value) but NOT issue_type

### Requirement: Frontend store adapts to workspace scope

Previously: Store indexed configs by `issueTypeId` via `issueTypeConfigsMap`.

The ExtraPropertyConfigStore SHALL index configs at workspace level. The `issueTypeConfigsMap` and related `fetchedMap` SHALL be replaced with workspace-level equivalents.

#### Scenario: Fetch all workspace configs

- **WHEN** `fetchWorkspaceConfigs(workspaceSlug)` is called
- **THEN** the store SHALL fetch all configs from `GET /workspaces/<slug>/extra-properties/` and populate `configMap`

#### Scenario: Get config by ID

- **WHEN** `getConfigById(id)` is called
- **THEN** the store SHALL return the config from `configMap` regardless of issue type

### Requirement: Frontend service adapts to new API paths

Previously: Service methods used paths with `issue_type_id` parameter.

The ExtraPropertyConfigService SHALL use workspace-scoped API paths.

#### Scenario: Service method signatures

- **WHEN** service methods are called
- **THEN** `getConfigs(workspaceSlug)`, `createConfig(workspaceSlug, data)`, `updateConfig(workspaceSlug, configId, data)`, `deleteConfig(workspaceSlug, configId)` SHALL use `/workspaces/<slug>/extra-properties/` paths
