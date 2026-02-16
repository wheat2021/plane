## Context

When a user creates a new issue using the "Quick Add" feature in the List view, the new row appears instantly (optimistic update) but displays the default "Task" icon instead of the correct issue type icon. This persists until the user interacts with the row (triggering a refresh) or the page is reloaded.

Investigation reveals that the optimistic update payload generated in `QuickAddIssueRoot` and passed to `issueQuickAdd` in the store lacks the `type_id`. Consequently, the `IssueIdentifier` component receives an issue object without a type, falls back to `getDefaultIssueTypeIcon`, and renders the "Task" icon.

## Goals / Non-Goals

**Goals:**

- Ensure the correct issue type icon is displayed immediately upon issue creation in the List view.
- Populate `type_id` in the optimistic update payload.

**Non-Goals:**

- changing the default issue type logic on the backend.

## Decisions

### 1. Inject Default Issue Type in Quick Add Form

We will modify `QuickAddIssueRoot` (in `apps/web/core/components/issues/issue-layouts/quick-add/root.tsx`) to fetch the default issue type for the project and include its `id` in the issue creation payload.

- **Rationale**: This is the centralized place where the form data is collected and sent to the callback. Ensuring the payload is complete here fixes the issue for all layouts using this component (List, Kanban, etc., if they share it).
- **Implementation**:
  - Use `useIssueType` hook to retrieve the list of issue types for the project.
  - Identify the default issue type (usually the one with `is_default: true` or the first one).
  - Merge `type_id` into the payload if it's not already present in `prePopulatedData`.

### Alternatives Considered

- **Modify `ListGroup`**: We could pass the default type from `ListGroup`, but that would require prop drilling and duplicating logic across different views (Kanban, Calendar, etc.). `QuickAddIssueRoot` is more self-contained.
- **Modify Store (`issueQuickAdd`)**: We could try to infer the type in the store, but the store might not have easy access to the "default" logic which is often UI/Context dependent, and it's better if the UI provides the complete intent.

## Risks / Trade-offs

- **Risk**: If `useIssueType` hasn't loaded types yet, we might still miss the type.
  - **Mitigation**: `QuickAddIssueRoot` is usually rendered after the project and its related data (like types) are loaded. We should ensure we handle the loading state or fallback gracefully (which is the current behavior, so no regression).

## Migration Plan

- No data migration needed. This is a frontend-only fix.
