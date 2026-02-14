## ADDED Requirements

### Requirement: Workspace settings page for extra property management

The system SHALL provide a workspace-level settings page at `/settings/extra-properties/` for managing Extra Property definitions. Only workspace ADMIN users SHALL have access to this page.

#### Scenario: Admin navigates to extra property settings

- **WHEN** a workspace admin navigates to workspace settings
- **THEN** the sidebar SHALL display an "Extra Properties" item under the FEATURES category

#### Scenario: Non-admin access denied

- **WHEN** a non-admin user attempts to access the extra property settings page
- **THEN** the system SHALL deny access and display a permission error

### Requirement: List all workspace extra properties

The settings page SHALL display all ExtraPropertyConfig records belonging to the current workspace, sorted by sort_order.

#### Scenario: Properties listed with details

- **WHEN** the admin opens the extra property settings page
- **THEN** each property SHALL display its label, key, type (控件类型), required status, and description

#### Scenario: Empty state

- **WHEN** no extra properties are defined in the workspace
- **THEN** the page SHALL display an empty state message with a prompt to create the first property

### Requirement: Create new extra property

The admin SHALL be able to create a new ExtraPropertyConfig through a form on the settings page.

#### Scenario: Create text property

- **WHEN** the admin fills in label, key, selects type "text", and submits
- **THEN** the system SHALL create the property via `POST /workspaces/<slug>/extra-properties/` and display it in the list

#### Scenario: Create select property with options

- **WHEN** the admin selects type "select" or "multiselect"
- **THEN** the form SHALL display an options editor allowing the admin to add/remove/reorder option values

#### Scenario: Duplicate key rejected

- **WHEN** the admin attempts to create a property with a key that already exists in the workspace
- **THEN** the system SHALL display a validation error indicating the key must be unique

#### Scenario: Invalid key format rejected

- **WHEN** the admin enters a key that does not match `^[a-zA-Z][a-zA-Z0-9_]*$`
- **THEN** the system SHALL display a validation error

### Requirement: Edit existing extra property

The admin SHALL be able to edit label, description, required flag, sort_order, and type-specific config (options, default_value, true/false_value) of an existing property.

#### Scenario: Edit property label

- **WHEN** the admin changes the label of an existing property and saves
- **THEN** the system SHALL update via `PATCH /workspaces/<slug>/extra-properties/<id>/` and reflect the change

#### Scenario: Key is not editable after creation

- **WHEN** the admin views an existing property in edit mode
- **THEN** the key field SHALL be read-only

#### Scenario: Type is not editable after creation

- **WHEN** the admin views an existing property in edit mode
- **THEN** the type field SHALL be read-only to prevent data incompatibility

### Requirement: Delete extra property

The admin SHALL be able to delete an ExtraPropertyConfig. Deletion SHALL remove bindings but NOT clean up existing Issue.extra_properties values.

#### Scenario: Delete property

- **WHEN** the admin clicks delete on a property and confirms
- **THEN** the system SHALL delete via `DELETE /workspaces/<slug>/extra-properties/<id>/` and remove the property from the list

#### Scenario: Delete confirmation

- **WHEN** the admin clicks delete on a property
- **THEN** the system SHALL display a confirmation dialog warning that this removes all bindings across projects

### Requirement: Sidebar navigation registration

The extra property settings page SHALL be registered in the workspace settings sidebar navigation system.

#### Scenario: Navigation item configured

- **WHEN** the workspace settings sidebar renders
- **THEN** an "Extra Properties" item SHALL appear under the FEATURES category with appropriate icon and i18n label
