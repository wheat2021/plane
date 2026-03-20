## ADDED Requirements

### Requirement: IssueTypeExtraProperty binding model

The system SHALL provide an `IssueTypeExtraProperty` model that associates an ExtraPropertyConfig with a specific project and issue type combination.

#### Scenario: Model fields

- **WHEN** a binding record is created
- **THEN** it SHALL contain fields: project (FK), issue_type (FK to IssueType), extra_property_config (FK to ExtraPropertyConfig), sort_order (FloatField), and inherit BaseModel fields

#### Scenario: Unique constraint

- **WHEN** a binding already exists for the same (project, issue_type, extra_property_config) combination
- **THEN** creating a duplicate SHALL be rejected with a unique constraint violation

#### Scenario: Cascade deletion from config

- **WHEN** an ExtraPropertyConfig is deleted
- **THEN** all associated IssueTypeExtraProperty bindings SHALL be cascade deleted

### Requirement: Binding list API endpoint

The system SHALL provide an API endpoint to list bindings for a project's issue type.

#### Scenario: List bindings

- **WHEN** `GET /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called
- **THEN** the response SHALL return all IssueTypeExtraProperty records for that project + issue type, including the related ExtraPropertyConfig detail, sorted by sort_order

#### Scenario: Permission check

- **WHEN** a user with at least MEMBER role makes the request
- **THEN** the system SHALL return the binding list

### Requirement: Create binding API endpoint

The system SHALL provide an API endpoint to create a binding between a project's issue type and an extra property config.

#### Scenario: Create binding

- **WHEN** `POST /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` is called with `{ extra_property_config_id: <id> }`
- **THEN** the system SHALL create the binding and return the created record with status 201

#### Scenario: Config not in workspace rejected

- **WHEN** the provided extra_property_config_id does not belong to the same workspace
- **THEN** the system SHALL return 400 with validation error

#### Scenario: Permission check for create

- **WHEN** a non-ADMIN user attempts to create a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Delete binding API endpoint

The system SHALL provide an API endpoint to remove a binding.

#### Scenario: Delete binding

- **WHEN** `DELETE /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/<binding_id>/` is called
- **THEN** the system SHALL delete the binding and return 204

#### Scenario: Permission check for delete

- **WHEN** a non-ADMIN user attempts to delete a binding
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Project settings UI for binding management

The project settings Work Item Types page SHALL allow admins to manage extra property bindings for each issue type.

#### Scenario: Expand item type to show bindings

- **WHEN** the admin clicks on a work item type card in project settings
- **THEN** the card SHALL expand to show the list of workspace extra properties with checkboxes indicating which are bound to this item type

#### Scenario: Enable extra property for item type

- **WHEN** the admin checks an unchecked extra property checkbox
- **THEN** the system SHALL call the create binding API and update the UI

#### Scenario: Disable extra property for item type

- **WHEN** the admin unchecks a checked extra property checkbox
- **THEN** the system SHALL call the delete binding API and update the UI

#### Scenario: No workspace properties defined

- **WHEN** no extra properties exist in the workspace
- **THEN** the expanded area SHALL display a message directing the admin to workspace settings to define properties first

### Requirement: Issue detail rendering uses bindings

The issue detail sidebar SHALL render extra properties based on the binding model instead of directly querying by issue type.

#### Scenario: Render bound properties

- **WHEN** an issue with a type is displayed in the detail sidebar
- **THEN** the system SHALL fetch bindings for the current project + issue type and render only the bound extra properties

#### Scenario: No bindings for type

- **WHEN** an issue type has no extra property bindings in the current project
- **THEN** the extra properties section SHALL not render

#### Scenario: Binding removed but value exists

- **WHEN** an extra property binding is removed but the issue still has a value for that property key in extra_properties
- **THEN** the value SHALL be preserved in the database but not displayed in the UI
