import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
// types
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useIssueTypeExtraProperty } from "@/hooks/store/use-issue-type-extra-property";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { ExtraPropertyRenderer } from "@/components/issues/extra-properties";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

export const WorkItemAdditionalSidebarProperties = observer((props: TWorkItemAdditionalSidebarProperties) => {
  const { workItemId, workItemTypeId, projectId, workspaceSlug, isEditable } = props;

  // store hooks
  const { fetchedMap: configFetchedMap, fetchWorkspaceConfigs, getConfigById } = useExtraPropertyConfig();
  const { fetchedMap: bindingFetchedMap, fetchBindings, getBindings, isConditionMet } = useIssueTypeExtraProperty();
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();

  // Get issue details
  const issue = getIssueById(workItemId);

  // Fetch workspace configs and bindings when needed
  useEffect(() => {
    if (workspaceSlug && !configFetchedMap[workspaceSlug]) {
      fetchWorkspaceConfigs(workspaceSlug).catch(console.error);
    }
  }, [workspaceSlug, configFetchedMap, fetchWorkspaceConfigs]);

  useEffect(() => {
    if (workspaceSlug && projectId && workItemTypeId && !bindingFetchedMap[projectId]?.[workItemTypeId]) {
      fetchBindings(workspaceSlug, projectId, workItemTypeId).catch(console.error);
    }
  }, [workspaceSlug, projectId, workItemTypeId, bindingFetchedMap, fetchBindings]);

  // Get configs via bindings, preserving binding sort_order, filtering condition bindings
  const { configs, requiredKeys } = useMemo(() => {
    if (!workItemTypeId) return { configs: [] as TExtraPropertyConfig[], requiredKeys: new Set<string>() };
    const bindings = getBindings(projectId, workItemTypeId);
    const configList: TExtraPropertyConfig[] = [];
    const reqKeys = new Set<string>();
    bindings.forEach((binding) => {
      // Skip condition bindings whose condition is not met
      if (binding.condition_config && !isConditionMet(projectId, workItemTypeId, binding.id, issue?.extra_properties)) {
        return;
      }
      const config = getConfigById(binding.extra_property_config);
      if (config) {
        configList.push(config);
        if (binding.is_required) reqKeys.add(config.key);
      }
    });
    return { configs: configList, requiredKeys: reqKeys };
  }, [workItemTypeId, projectId, getBindings, getConfigById, isConditionMet, issue?.extra_properties]);

  // Handler for updating extra properties
  const handleChange = (key: string, value: TExtraPropertyValue) => {
    if (!issue) return;

    const currentExtraProperties = issue.extra_properties || {};
    const updatedExtraProperties = {
      ...currentExtraProperties,
      [key]: value,
    };

    updateIssue(workspaceSlug, projectId, workItemId, {
      extra_properties: updatedExtraProperties,
    }).catch(console.error);
  };

  // Don't render if no configs or no issue type
  if (!workItemTypeId || configs.length === 0) {
    return null;
  }

  return (
    <ExtraPropertyRenderer
      configs={configs}
      values={issue?.extra_properties}
      onChange={handleChange}
      isEditable={isEditable}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      requiredKeys={requiredKeys}
    />
  );
});
