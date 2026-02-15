## MODIFIED Requirements

### Requirement: IssueTypeExtraProperty binding model

Previously: The binding model contained project (FK), issue_type (FK), extra_property_config (FK), sort_order (FloatField), and BaseModel fields.

The `IssueTypeExtraProperty` model SHALL include an additional `is_required` BooleanField (default=False) that indicates whether the bound extra property is mandatory for work items of this type in this project.

#### Scenario: Model fields

- **WHEN** a binding record is created
- **THEN** it SHALL contain fields: project (FK), issue_type (FK to IssueType), extra_property_config (FK to ExtraPropertyConfig), sort_order (FloatField), is_required (BooleanField, default=False), and inherit BaseModel fields

#### Scenario: Unique constraint

- **WHEN** a binding already exists for the same (project, issue_type, extra_property_config) combination
- **THEN** creating a duplicate SHALL be rejected with a unique constraint violation

#### Scenario: Cascade deletion from config

- **WHEN** an ExtraPropertyConfig is deleted
- **THEN** all associated IssueTypeExtraProperty bindings SHALL be cascade deleted

### Requirement: Create binding API endpoint

Previously: The create endpoint accepted `{ extra_property_config_id: <id> }` and optional sort_order.

The create binding API endpoint SHALL accept an optional `is_required` field in the request payload.

#### Scenario: Create binding with required flag

- **WHEN** `POST /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called with `{ extra_property_config: <id>, is_required: true }`
- **THEN** the system SHALL create the binding with is_required=true and return the created record with status 201

#### Scenario: Create binding without required flag

- **WHEN** `POST /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called with `{ extra_property_config: <id> }` (no is_required)
- **THEN** the system SHALL create the binding with is_required=false (default) and return the created record with status 201

#### Scenario: Config not in workspace rejected

- **WHEN** the provided extra_property_config does not belong to the same workspace
- **THEN** the system SHALL return 400 with validation error

#### Scenario: Permission check for create

- **WHEN** a non-ADMIN user attempts to create a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Binding list API endpoint

Previously: The list endpoint returned bindings with nested ExtraPropertyConfig detail.

The binding list API response SHALL include the `is_required` field for each binding record.

#### Scenario: List bindings

- **WHEN** `GET /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called
- **THEN** the response SHALL return all IssueTypeExtraProperty records for that project + issue type, including the related ExtraPropertyConfig detail and is_required field, sorted by sort_order

#### Scenario: Permission check

- **WHEN** a user with at least MEMBER role makes the request
- **THEN** the system SHALL return the binding list

## ADDED Requirements

### Requirement: Update binding API endpoint

The system SHALL provide a PATCH endpoint to update binding attributes (is_required, sort_order).

#### Scenario: Update is_required

- **WHEN** `PATCH /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/<binding_id>/` is called with `{ is_required: true }`
- **THEN** the system SHALL update the binding's is_required field and return the updated record

#### Scenario: Update sort_order

- **WHEN** `PATCH /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/<binding_id>/` is called with `{ sort_order: 100 }`
- **THEN** the system SHALL update the binding's sort_order field and return the updated record

#### Scenario: Permission check for update

- **WHEN** a non-ADMIN user attempts to update a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Issue detail rendering uses binding required status

The issue detail sidebar SHALL use `is_required` from the binding record to determine whether an extra property field is mandatory.

#### Scenario: Render required property

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=true
- **THEN** the property field SHALL be rendered with a required indicator and empty-value validation

#### Scenario: Render optional property

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=false
- **THEN** the property field SHALL be rendered without a required indicator and allow empty values

### Requirement: Frontend binding store and types include is_required

The IssueTypeExtraProperty TypeScript type and MobX store SHALL include `is_required` in binding records.

#### Scenario: TypeScript type definition

- **WHEN** the TIssueTypeExtraProperty type is defined
- **THEN** it SHALL include `is_required: boolean` field

#### Scenario: Store tracks is_required

- **WHEN** bindings are fetched and stored
- **THEN** each binding record in the store SHALL include the is_required value from the API response

#### Scenario: Update binding in store

- **WHEN** the admin toggles the required status of a binding
- **THEN** the store SHALL call PATCH on the binding API and update the local binding record's is_required
