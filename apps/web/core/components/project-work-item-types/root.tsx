import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { ProjectWorkItemTypesLoader, WorkItemTypeList } from "@/components/project-work-item-types";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";
import { useUserPermissions } from "@/hooks/store/user";

type TProjectWorkItemTypesRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectWorkItemTypesRoot = observer(function ProjectWorkItemTypesRoot(
  props: TProjectWorkItemTypesRootProps
) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    workspaceIssueTypes,
    fetchWorkspaceIssueTypes,
    getProjectIssueTypes,
    fetchProjectIssueTypes,
    addProjectIssueType,
    updateProjectIssueType,
    removeProjectIssueType,
  } = useIssueType();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const projectIssueTypes = getProjectIssueTypes(projectId) ?? [];

  // Fetch workspace issue types
  useSWR(
    workspaceSlug ? `WORKSPACE_ISSUE_TYPES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceIssueTypes(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Fetch project issue types
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectIssueTypes(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Handlers
  const handleEnable = useCallback(
    async (issueTypeId: string) => {
      await addProjectIssueType(workspaceSlug, projectId, issueTypeId);
    },
    [workspaceSlug, projectId, addProjectIssueType]
  );

  const handleDisable = useCallback(
    async (projectIssueTypeId: string) => {
      return await removeProjectIssueType(workspaceSlug, projectId, projectIssueTypeId);
    },
    [workspaceSlug, projectId, removeProjectIssueType]
  );

  const handleSetDefault = useCallback(
    async (projectIssueTypeId: string) => {
      await updateProjectIssueType(workspaceSlug, projectId, projectIssueTypeId, { is_default: true });
    },
    [workspaceSlug, projectId, updateProjectIssueType]
  );

  // Loader
  if (!workspaceIssueTypes) return <ProjectWorkItemTypesLoader />;

  return (
    <div className="md:w-2/3">
      <WorkItemTypeList
        workspaceIssueTypes={workspaceIssueTypes}
        projectIssueTypes={projectIssueTypes}
        isEditable={isEditable}
        onEnable={handleEnable}
        onDisable={handleDisable}
        onSetDefault={handleSetDefault}
      />
    </div>
  );
});
