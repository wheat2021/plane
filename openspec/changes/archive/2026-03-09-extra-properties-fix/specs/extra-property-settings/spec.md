## MODIFIED Requirements

### Requirement: Create new extra property

Previously: The create form included a required toggle. The available types were text, textarea, select, multiselect, checkbox, markdown.

The admin SHALL be able to create a new ExtraPropertyConfig through a form on the settings page. The form SHALL NOT include a required toggle. The available property types SHALL be: text, textarea, select, multiselect, checkbox（移除 markdown）。描述字段 SHALL 使用受控输入模式（`Controller`），确保用户可以正常输入内容。

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

### Requirement: Edit existing extra property

Previously: The edit form allowed editing label, description, required flag, sort_order, and type-specific config. Type field was read-only.

The admin SHALL be able to edit label, description, sort_order, and type-specific config (options, default_value, true/false_value) of an existing property. The required flag and type field SHALL NOT be editable on this page.

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
