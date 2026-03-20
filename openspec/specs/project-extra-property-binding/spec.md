# Project Extra Property Binding

## Purpose

定义 IssueTypeExtraProperty 绑定模型、API 端点、前端 store 和 UI 的规格，包括 condition binding 的自动管理。

## Requirements

### Requirement: IssueTypeExtraProperty binding model

The `IssueTypeExtraProperty` model SHALL include `is_required` BooleanField (default=False) and a new `condition_config` ForeignKey (nullable) pointing to the parent ExtraPropertyConfig that triggers this binding. When `condition_config` is NULL, the binding is a normal (manually managed) binding. When `condition_config` is NOT NULL, the binding is a condition binding (automatically managed).

#### Scenario: Model fields

- **WHEN** a binding record is created
- **THEN** it SHALL contain fields: project (FK), issue_type (FK to IssueType), extra_property_config (FK to ExtraPropertyConfig), sort_order (FloatField), is_required (BooleanField, default=False), condition_config (FK to ExtraPropertyConfig, nullable), and inherit BaseModel fields

#### Scenario: Unique constraint

- **WHEN** a binding already exists for the same (project, issue_type, extra_property_config) combination
- **THEN** creating a duplicate SHALL be rejected with a unique constraint violation

#### Scenario: Cascade deletion from config

- **WHEN** an ExtraPropertyConfig is deleted
- **THEN** all associated IssueTypeExtraProperty bindings SHALL be cascade deleted

#### Scenario: Cascade deletion from condition_config

- **WHEN** an ExtraPropertyConfig referenced by condition_config is deleted
- **THEN** all bindings with that condition_config SHALL be cascade deleted

### Requirement: Create binding API endpoint

The create binding API endpoint SHALL accept an optional `is_required` field. After creating the binding, the endpoint SHALL automatically create condition bindings for any extra_input references in the bound config's options (recursively for nested chains). Condition bindings SHALL have condition_config set to the parent config, is_required from extra_input.required, and sort_order after the parent.

#### Scenario: Create binding with automatic condition binding creation

- **WHEN** `POST /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called with a config that has options with extra_input
- **THEN** the system SHALL create the primary binding AND automatically create condition bindings for all referenced extra_input configs
- **AND** condition bindings SHALL have condition_config set to the parent ExtraPropertyConfig
- **AND** condition bindings SHALL have is_required from extra_input.required
- **AND** condition bindings SHALL have sort_order positioned after the parent binding

#### Scenario: Recursive condition binding creation

- **WHEN** a condition binding's config also has options with extra_input
- **THEN** the system SHALL recursively create condition bindings for the nested references

#### Scenario: No duplicate condition binding

- **WHEN** the extra_input config already has a binding (normal or condition) for this project+issueType
- **THEN** the system SHALL NOT create a duplicate binding

#### Scenario: Config not in workspace rejected

- **WHEN** the provided extra_property_config does not belong to the same workspace
- **THEN** the system SHALL return 400 with validation error

#### Scenario: Permission check for create

- **WHEN** a non-ADMIN user attempts to create a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Delete binding API endpoint

The delete binding API endpoint SHALL reject deletion of condition bindings and SHALL cascade delete condition bindings when a normal binding is deleted.

#### Scenario: Delete normal binding cascades condition bindings

- **WHEN** a normal binding (condition_config=null) is deleted
- **THEN** all condition bindings whose condition_config points to the deleted binding's extra_property_config SHALL be deleted (recursively)

#### Scenario: Delete condition binding rejected

- **WHEN** a DELETE request targets a binding with condition_config != null
- **THEN** the system SHALL return HTTP 400 with message indicating the binding is managed by its parent config

### Requirement: Binding list API endpoint

The binding list API response SHALL include `is_required` and `condition_config` fields for each binding record.

#### Scenario: List bindings

- **WHEN** `GET /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called
- **THEN** the response SHALL return all IssueTypeExtraProperty records for that project + issue type, including the related ExtraPropertyConfig detail, is_required, and condition_config fields, sorted by sort_order

#### Scenario: Permission check

- **WHEN** a user with at least MEMBER role makes the request
- **THEN** the system SHALL return the binding list

### Requirement: Update binding API endpoint

The system SHALL provide a PATCH endpoint to update binding attributes. For condition bindings, only sort_order SHALL be updatable. is_required of condition bindings SHALL NOT be updatable via this endpoint (it is controlled by the parent config's extra_input.required).

#### Scenario: Update sort_order of condition binding

- **WHEN** `PATCH` is called on a condition binding with `{ sort_order: 100 }`
- **THEN** the system SHALL update the sort_order

#### Scenario: Update is_required of condition binding rejected

- **WHEN** `PATCH` is called on a condition binding with `{ is_required: true }`
- **THEN** the system SHALL return HTTP 400 indicating is_required is controlled by parent config

#### Scenario: Update normal binding

- **WHEN** `PATCH` is called on a normal binding with `{ is_required: true, sort_order: 50 }`
- **THEN** the system SHALL update both fields

#### Scenario: Permission check for update

- **WHEN** a non-ADMIN user attempts to update a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Workspace config 更新时同步 condition binding

更新 ExtraPropertyConfig 时，系统 SHALL 对比新旧 extra_input 配置，同步更新所有已绑定该 config 的 project+issueType 的 condition binding。

#### Scenario: 新增 extra_input 同步创建

- **WHEN** ExtraPropertyConfig 更新后某个 option 新增了 extra_input
- **THEN** 对所有已绑定该 config 的 project+issueType，SHALL 自动创建对应的 condition binding

#### Scenario: 移除 extra_input 同步删除

- **WHEN** ExtraPropertyConfig 更新后某个 option 移除了 extra_input
- **AND** 该 extra_input config 不再被该 config 的任何其他 option 关联
- **THEN** 对所有 project+issueType，SHALL 删除对应的 condition binding（递归删除嵌套）

#### Scenario: 变更 extra_input.required 同步更新

- **WHEN** ExtraPropertyConfig 更新后某个 option 的 extra_input.required 变更
- **THEN** 对所有 project+issueType 的对应 condition binding，SHALL 更新 is_required

### Requirement: Frontend binding store and types include condition_config

The IssueTypeExtraProperty TypeScript type and MobX store SHALL include `is_required` and `condition_config` in binding records.

#### Scenario: TypeScript type definition

- **WHEN** the TIssueTypeExtraProperty type is defined
- **THEN** it SHALL include `is_required: boolean` and `condition_config: string | null` fields

#### Scenario: Store tracks condition_config

- **WHEN** bindings are fetched and stored
- **THEN** each binding record in the store SHALL include the condition_config value from the API response

#### Scenario: Update binding in store

- **WHEN** the admin toggles the required status of a normal binding
- **THEN** the store SHALL call PATCH on the binding API and update the local binding record's is_required

#### Scenario: Store 提供 condition 关系查询方法

- **WHEN** 前端需要判断某个 binding 是否为 condition binding
- **THEN** store SHALL 提供 `isConditionBinding(bindingId)` 方法
- **AND** store SHALL 提供 `isConditionMet(projectId, issueTypeId, bindingId, issueExtraProperties)` 方法用于判断条件是否满足

### Requirement: Issue detail rendering uses binding required status

The issue detail sidebar SHALL use `is_required` from the binding record to determine whether an extra property field is mandatory. For condition bindings, the field SHALL only be rendered when the condition is met (parent property value matches trigger option).

#### Scenario: Render required property

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=true
- **AND** the binding is a normal binding OR the condition is met
- **THEN** the property field SHALL be rendered with a required indicator and empty-value validation

#### Scenario: Render optional property

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=false
- **THEN** the property field SHALL be rendered without a required indicator and allow empty values

#### Scenario: Condition binding hidden when condition not met

- **WHEN** a condition binding's parent property value does not match any trigger option
- **THEN** the property field SHALL NOT be rendered in the sidebar
