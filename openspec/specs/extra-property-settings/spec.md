## MODIFIED Requirements

### Requirement: List all workspace extra properties

Previously: The settings page displays each property with label, key, type, required status, and description.

The settings page SHALL display all ExtraPropertyConfig records belonging to the current workspace, sorted by sort_order. Each property SHALL display its label, key, type (控件类型), and description. The required status SHALL NOT be displayed on this page since it is now configured per work item type at the binding level.

#### Scenario: Properties listed with details

- **WHEN** the admin opens the extra property settings page
- **THEN** each property SHALL display its label, key, type (控件类型), and description
- **THEN** the required status SHALL NOT be shown in the property list

#### Scenario: Empty state

- **WHEN** no extra properties are defined in the workspace
- **THEN** the page SHALL display an empty state message with a prompt to create the first property

### Requirement: Create new extra property

Previously: The create form included a required toggle.

The admin SHALL be able to create a new ExtraPropertyConfig through a form on the settings page. The form SHALL NOT include a required toggle since required status is now configured at the binding level.

#### Scenario: Create text property

- **WHEN** the admin fills in label, key, selects type "text", and submits
- **THEN** the system SHALL create the property via `POST /workspaces/<slug>/extra-properties/` and display it in the list
- **THEN** the create form SHALL NOT include a required field

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

Previously: The edit form allowed editing label, description, required flag, sort_order, and type-specific config.

The admin SHALL be able to edit label, description, sort_order, and type-specific config (options, default_value, true/false_value) of an existing property. The required flag SHALL NOT be editable on this page since it is now configured at the binding level.

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
