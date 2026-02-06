import { useEffect } from "react";
import { observer } from "mobx-react";
// types
import type { TExtraPropertyValue } from "@plane/types";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
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
  const { getConfigsByIssueType, fetchConfigsForIssueType, fetchedMap } = useExtraPropertyConfig();
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();

  // Get issue details
  const issue = getIssueById(workItemId);

  // Get extra property configs for this issue type
  const configs = workItemTypeId ? getConfigsByIssueType(workItemTypeId) : [];

  // Fetch configs when issue type changes
  useEffect(() => {
    if (workItemTypeId && workspaceSlug && !fetchedMap[workItemTypeId]) {
      fetchConfigsForIssueType(workspaceSlug, workItemTypeId).catch(console.error);
    }
  }, [workItemTypeId, workspaceSlug, fetchedMap, fetchConfigsForIssueType]);

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
    />
  );
});
