import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { ISearchIssueResponse, TIssue } from "@plane/types";
// components
import type { THandleProjectEntitiesFetchProps } from "@/components/issues/issue-modal/context";
import { IssueModalContext } from "@/components/issues/issue-modal/context";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";
import { useUser } from "@/hooks/store/user/user-user";

export type TIssueModalProviderProps = {
  templateId?: string;
  dataForPreload?: Partial<TIssue>;
  allowedProjectIds?: string[];
  children: React.ReactNode;
};

export const IssueModalProvider = observer(function IssueModalProvider(props: TIssueModalProviderProps) {
  const { children, allowedProjectIds } = props;
  // states
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { getProjectDefaultIssueType, fetchProjectIssueTypes } = useIssueType();
  // derived values
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});

  const getIssueTypeIdOnProjectChange = useCallback(
    (projectId: string) => {
      const defaultType = getProjectDefaultIssueType(projectId);
      return defaultType?.issue_type ?? null;
    },
    [getProjectDefaultIssueType]
  );

  const handleProjectEntitiesFetch = useCallback(
    async (fetchProps: THandleProjectEntitiesFetchProps) => {
      const { workItemProjectId, workspaceSlug: wsSlug } = fetchProps;
      if (wsSlug && workItemProjectId) {
        await fetchProjectIssueTypes(wsSlug, workItemProjectId);
      }
    },
    [fetchProjectIssueTypes]
  );

  return (
    <IssueModalContext.Provider
      value={{
        allowedProjectIds: allowedProjectIds ?? projectIdsWithCreatePermissions,
        workItemTemplateId: null,
        setWorkItemTemplateId: () => {},
        isApplyingTemplate: false,
        setIsApplyingTemplate: () => {},
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues: {},
        setIssuePropertyValues: () => {},
        issuePropertyValueErrors: {},
        setIssuePropertyValueErrors: () => {},
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength: () => 0,
        handlePropertyValuesValidation: () => true,
        handleCreateUpdatePropertyValues: () => Promise.resolve(),
        handleProjectEntitiesFetch,
        handleTemplateChange: () => Promise.resolve(),
        handleConvert: () => Promise.resolve(),
        handleCreateSubWorkItem: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
