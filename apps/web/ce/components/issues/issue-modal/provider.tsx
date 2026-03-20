import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
// components
import type {
  TActiveAdditionalPropertiesProps,
  TCreateUpdatePropertyValuesProps,
  THandleProjectEntitiesFetchProps,
  TPropertyValuesValidationProps,
} from "@/components/issues/issue-modal/context";
import { IssueModalContext } from "@/components/issues/issue-modal/context";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueType } from "@/hooks/store/use-issue-type";
import { useIssueTypeExtraProperty } from "@/hooks/store/use-issue-type-extra-property";
import { useUser } from "@/hooks/store/user/user-user";
// types
import type { TIssuePropertyValueErrors, TIssuePropertyValues } from "@/plane-web/types/issue-types";

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
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { getProjectDefaultIssueType, fetchProjectIssueTypes } = useIssueType();
  const { getBindings } = useIssueTypeExtraProperty();
  const { updateIssue } = useIssueDetail();
  const { getConfigById } = useExtraPropertyConfig();
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

  const getActiveAdditionalPropertiesLength = useCallback(
    (props: TActiveAdditionalPropertiesProps) => {
      const { projectId, watch } = props;
      const typeId = watch("type_id");
      if (!projectId || !typeId) return 0;

      const bindings = getBindings(projectId, typeId);
      return bindings?.length ?? 0;
    },
    [getBindings]
  );

  const handlePropertyValuesValidation = useCallback(
    (props: TPropertyValuesValidationProps) => {
      const { projectId, watch } = props;
      const typeId = watch("type_id");
      if (!projectId || !typeId) return true;

      const bindings = getBindings(projectId, typeId);
      if (!bindings || bindings.length === 0) return true;

      const errors: TIssuePropertyValueErrors = {};
      const requiredBindings = bindings.filter((b) => b.is_required);

      requiredBindings.forEach((binding) => {
        const config = getConfigById(binding.extra_property_config);
        if (!config) return;

        const stateValue = issuePropertyValues[config.key];
        const value = stateValue !== undefined ? stateValue : (config.default_value ?? null);
        const isEmpty =
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          errors[config.key] = "This field is required";
        }
      });

      if (Object.keys(errors).length > 0) {
        setIssuePropertyValueErrors(errors);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Please fill all the required additional properties",
        });
        return false;
      }

      return true;
    },
    [getBindings, getConfigById, issuePropertyValues]
  );

  const handleCreateUpdatePropertyValues = useCallback(
    async (props: TCreateUpdatePropertyValuesProps) => {
      const { issueId, projectId, workspaceSlug } = props;

      if (Object.keys(issuePropertyValues).length === 0) return;

      try {
        await updateIssue(workspaceSlug, projectId, issueId, {
          extra_properties: issuePropertyValues,
        });
        setIssuePropertyValues({});
        setIssuePropertyValueErrors({});
      } catch (error) {
        console.error("Error updating extra properties", error);
      }
    },
    [issuePropertyValues, updateIssue]
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
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
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
