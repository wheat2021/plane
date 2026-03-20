## MODIFIED Requirements

### Requirement: Project settings Work Item Types page

Previously: The Work Item Types settings page displays a list of workspace issue types with enable/disable toggle and default selection. No extra property management.

The project settings Work Item Types page SHALL extend each work item type card to support expanding for extra property binding management.

#### Scenario: Work item type card is expandable

- **WHEN** the admin views the Work Item Types settings page
- **THEN** each enabled work item type card SHALL have a clickable expand/collapse control

#### Scenario: Expanded card shows extra property bindings

- **WHEN** the admin expands a work item type card
- **THEN** the expanded area SHALL display all workspace-defined extra properties as a checkbox list, with checked items indicating properties bound to this item type in the current project

#### Scenario: Toggle extra property binding

- **WHEN** the admin checks or unchecks an extra property in the expanded area
- **THEN** the system SHALL create or delete the corresponding IssueTypeExtraProperty binding via the binding API

#### Scenario: Disabled item type not expandable

- **WHEN** a work item type is not enabled for the project
- **THEN** the card SHALL NOT be expandable and SHALL NOT show extra property binding options

#### Scenario: Non-admin cannot modify bindings

- **WHEN** a non-admin user views the work item types settings
- **THEN** the expanded area (if shown) SHALL display bindings as read-only without checkboxes
