import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueType, TProjectIssueType } from "@plane/types";
// components
import { WorkItemTypeItem } from "./work-item-type-item";

type TWorkItemTypeListProps = {
  workspaceIssueTypes: TIssueType[];
  projectIssueTypes: TProjectIssueType[];
  isEditable: boolean;
  onEnable: (issueTypeId: string) => Promise<void>;
  onDisable: (projectIssueTypeId: string) => Promise<{ migrated_count: number }>;
  onSetDefault: (projectIssueTypeId: string) => Promise<void>;
};

export const WorkItemTypeList = observer(function WorkItemTypeList(props: TWorkItemTypeListProps) {
  const { workspaceIssueTypes, projectIssueTypes, isEditable, onEnable, onDisable, onSetDefault } = props;
  const { t } = useTranslation();

  // Create a map of issue_type_id to project issue type for quick lookup
  const projectIssueTypeMap = new Map<string, TProjectIssueType>();
  projectIssueTypes.forEach((pit) => {
    projectIssueTypeMap.set(pit.issue_type, pit);
  });

  if (workspaceIssueTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-custom-border-200 bg-custom-background-90 py-10">
        <p className="text-sm text-custom-text-300">{t("project_settings.work_item_types.no_types_available")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {workspaceIssueTypes.map((issueType) => (
        <WorkItemTypeItem
          key={issueType.id}
          issueType={issueType}
          projectIssueType={projectIssueTypeMap.get(issueType.id)}
          isEditable={isEditable}
          onEnable={onEnable}
          onDisable={onDisable}
          onSetDefault={onSetDefault}
        />
      ))}
    </div>
  );
});
