## ADDED Requirements

### Requirement: Create modal renders extra properties based on work item type

The work item creation modal SHALL render extra property controls when a work item type with bound extra properties is selected.

#### Scenario: Work item type with bound properties selected

- **WHEN** the user selects a work item type that has bound extra properties in the current project
- **THEN** the modal SHALL display the corresponding extra property controls in the `WorkItemModalAdditionalProperties` section
- **THEN** each control SHALL match the property type (text, textarea, select, multiselect, checkbox, markdown)

#### Scenario: Work item type with no bound properties

- **WHEN** the user selects a work item type that has no bound extra properties
- **THEN** the `WorkItemModalAdditionalProperties` section SHALL render nothing (no empty state)

#### Scenario: No work item type selected

- **WHEN** no work item type is selected (type_id is null)
- **THEN** the `WorkItemModalAdditionalProperties` section SHALL render nothing

#### Scenario: Data fetching on type selection

- **WHEN** a work item type is selected and bindings have not been fetched for this (project, type) combination
- **THEN** the system SHALL fetch workspace configs via `fetchWorkspaceConfigs` and bindings via `fetchBindings`
- **THEN** fetched data SHALL be cached for subsequent renders (no redundant API calls)

### Requirement: Extra property values managed in modal context

The creation modal SHALL manage extra property values through the `issuePropertyValues` context state.

#### Scenario: User fills in property value

- **WHEN** the user enters a value for an extra property control in the create form
- **THEN** the value SHALL be stored in `issuePropertyValues` keyed by the property's `key` field

#### Scenario: Work item type changed

- **WHEN** the user switches to a different work item type
- **THEN** previously filled extra property values SHALL be cleared
- **THEN** the new type's bound properties SHALL be loaded and displayed

#### Scenario: Project changed

- **WHEN** the user switches to a different project
- **THEN** previously filled extra property values SHALL be cleared

### Requirement: Required property validation on form submit

The creation modal SHALL validate that all required extra properties have values before allowing form submission.

#### Scenario: All required properties filled

- **WHEN** the user submits the form and all `is_required=true` bound properties have non-empty values
- **THEN** form submission SHALL proceed normally

#### Scenario: Required property missing value

- **WHEN** the user submits the form and one or more `is_required=true` bound properties have empty/null values
- **THEN** form submission SHALL be prevented
- **THEN** a toast error SHALL be displayed listing the missing required properties
- **THEN** the `issuePropertyValueErrors` state SHALL be updated to mark the offending fields

#### Scenario: No required properties

- **WHEN** the user submits the form and no bound properties have `is_required=true`
- **THEN** validation SHALL pass regardless of extra property values

#### Scenario: Empty value definition

- **WHEN** checking if a property value is empty
- **THEN** `null`, `undefined`, empty string `""`, and empty array `[]` SHALL be considered empty
- **THEN** `false` for checkbox type SHALL NOT be considered empty (it is a valid boolean value)

### Requirement: Extra property values saved after issue creation

The system SHALL save extra property values to the created issue after successful issue creation.

#### Scenario: Issue created with property values

- **WHEN** an issue is successfully created and the user has filled in extra property values
- **THEN** `handleCreateUpdatePropertyValues` SHALL call `updateIssue` with the `extra_properties` payload containing all filled values
- **THEN** the property values SHALL be saved using the issue ID from the creation response

#### Scenario: Issue created with no property values

- **WHEN** an issue is successfully created and no extra property values were filled in (all empty or no properties bound)
- **THEN** `handleCreateUpdatePropertyValues` SHALL NOT make an API call

#### Scenario: Create more mode

- **WHEN** the user has "create more" enabled and submits successfully
- **THEN** the extra property values SHALL be cleared for the next creation

### Requirement: Active additional properties length calculation

The `getActiveAdditionalPropertiesLength` method SHALL return the count of extra properties bound to the currently selected work item type.

#### Scenario: Type with bound properties

- **WHEN** the selected work item type has 3 bound extra properties in the current project
- **THEN** `getActiveAdditionalPropertiesLength` SHALL return 3

#### Scenario: No type selected

- **WHEN** no work item type is selected
- **THEN** `getActiveAdditionalPropertiesLength` SHALL return 0

#### Scenario: Type with no bound properties

- **WHEN** the selected work item type has no bound extra properties
- **THEN** `getActiveAdditionalPropertiesLength` SHALL return 0
