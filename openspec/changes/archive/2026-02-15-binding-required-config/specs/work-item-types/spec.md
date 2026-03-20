## MODIFIED Requirements

### Requirement: Project settings Work Item Types page

Previously: The expanded area displayed all workspace-defined extra properties as a checkbox list, with checked items indicating properties bound to this item type. No required configuration was available.

The project settings Work Item Types page SHALL extend each work item type card's expanded binding area to include a required toggle for each bound extra property.

#### Scenario: Work item type card is expandable

- **WHEN** the admin views the Work Item Types settings page
- **THEN** each enabled work item type card SHALL have a clickable expand/collapse control

#### Scenario: Expanded card shows extra property bindings with required toggle

- **WHEN** the admin expands a work item type card
- **THEN** the expanded area SHALL display all workspace-defined extra properties as a checkbox list
- **THEN** each checked (bound) property SHALL display an inline "Required" toggle showing the current is_required state

#### Scenario: Toggle required status on bound property

- **WHEN** the admin clicks the "Required" toggle on a bound extra property
- **THEN** the system SHALL call PATCH on the binding API to update is_required and reflect the change in the UI

#### Scenario: Required toggle only visible for bound properties

- **WHEN** an extra property is not bound (checkbox unchecked)
- **THEN** the "Required" toggle SHALL NOT be displayed for that property

#### Scenario: Toggle extra property binding

- **WHEN** the admin checks or unchecks an extra property in the expanded area
- **THEN** the system SHALL create or delete the corresponding IssueTypeExtraProperty binding via the binding API

#### Scenario: Disabled item type not expandable

- **WHEN** a work item type is not enabled for the project
- **THEN** the card SHALL NOT be expandable and SHALL NOT show extra property binding options

#### Scenario: Non-admin cannot modify bindings or required status

- **WHEN** a non-admin user views the work item types settings
- **THEN** the expanded area (if shown) SHALL display bindings and required status as read-only without checkboxes or toggles
