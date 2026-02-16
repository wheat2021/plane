# Work Item Display

## Purpose

This capability defines how work items are displayed across various views (list, kanban, etc.) to ensure consistency and clarity.

## Requirements

### Requirement: Work Item Icon Consistency

The system SHALL display the correct work item type icon immediately upon creation in all list views.

#### Scenario: Quick Add in List View

- **WHEN** user creates a new work item using the Quick Add feature in the list view
- **THEN** the new row appears with the icon corresponding to the created item's type (e.g., Bug, Feature)
- **AND** the icon is NOT the default 'Task' icon unless the created item is actually of type 'Task'
