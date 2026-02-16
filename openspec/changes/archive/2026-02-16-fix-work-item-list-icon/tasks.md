## 1. Implementation

- [x] 1.1 Modify `QuickAddIssueRoot` in `apps/web/core/components/issues/issue-layouts/quick-add/root.tsx` to fetch the default issue type using `useIssueType` hook.
- [x] 1.2 Update the `onSubmitHandler` to include the default `type_id` in the issue creation payload if it's not already present in `prePopulatedData` or `formData`.

## 2. Verification

- [x] 2.1 Verify that the `quickAddCallback` receives a payload containing `type_id`.
- [x] 2.2 Verify that new work items created via Quick Add display the correct icon immediately in the list view.
