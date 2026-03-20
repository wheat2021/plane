## MODIFIED Requirements

### Requirement: Issue detail rendering uses binding required status

Previously: The issue detail sidebar SHALL use `is_required` from the binding record to determine whether an extra property field is mandatory.

The issue detail sidebar and the creation modal SHALL both use `is_required` from the binding record to determine whether an extra property field is mandatory. The creation modal SHALL use the same binding data to enforce required validation before form submission.

#### Scenario: Render required property in detail view

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=true
- **THEN** the property field SHALL be rendered with a required indicator and empty-value validation

#### Scenario: Render optional property in detail view

- **WHEN** an issue with a type is displayed and a bound extra property has is_required=false
- **THEN** the property field SHALL be rendered without a required indicator and allow empty values

#### Scenario: Validate required property in create form

- **WHEN** a new issue is being created and the selected work item type has a bound extra property with is_required=true
- **THEN** the creation form SHALL prevent submission if that property has no value

#### Scenario: Optional property in create form

- **WHEN** a new issue is being created and the selected work item type has a bound extra property with is_required=false
- **THEN** the creation form SHALL allow submission regardless of whether that property has a value
