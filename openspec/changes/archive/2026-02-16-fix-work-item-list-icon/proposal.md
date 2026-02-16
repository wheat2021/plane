## Why

When a new work item is created and added to the work item list, the row icon incorrectly defaults to the "Task" icon, regardless of the actual work item type (e.g., Bug, Feature). The icon only updates to the correct type after the user clicks on the row. This creates a confusing user experience and visual inconsistency.

## What Changes

- Update the work item list rendering logic to ensure the correct issue type icon is displayed immediately upon item creation.
- Fix the data flow in `IssueIdentifier` or `IssueBlock` to ensure `type_id` is available and correctly resolved to an icon without requiring user interaction.

## Capabilities

### Modified Capabilities

- `work-item-display`: Ensure work items in the list view display the icon corresponding to their actual type immediately after creation.

## Impact

- **Components**: `IssueIdentifier`, `IssueBlock`, `IssueTypeIconDisplay`.
- **Store**: Potentially `useIssueDetail` or `useIssueType` if data synchronization is the root cause.
