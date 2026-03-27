import type { FC } from "react";
import { CalendarDays, LayersIcon, Paperclip } from "lucide-react";
// types
import { ISSUE_GROUP_BY_OPTIONS } from "@plane/constants";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TExtraPropertyConfig } from "@plane/types";
import {
  LinkIcon,
  CycleIcon,
  StatePropertyIcon,
  ModuleIcon,
  MembersPropertyIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  LabelPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
} from "@plane/propel/icons";
import type {
  IGroupByColumn,
  IIssueDisplayProperties,
  TGetColumns,
  TIssueGroupByOptions,
  TSpreadsheetColumn,
} from "@plane/types";
// components
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetModuleColumn,
  SpreadsheetCycleColumn,
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "@/components/issues/issue-layouts/spreadsheet/columns";
// store
import { store } from "@/lib/store-context";

export type TGetScopeMemberIdsResult = {
  memberIds: string[];
  includeNone: boolean;
};

export const getScopeMemberIds = ({ isWorkspaceLevel, projectId }: TGetColumns): TGetScopeMemberIdsResult => {
  // store values
  const { workspaceMemberIds } = store.memberRoot.workspace;
  const { projectMemberIds } = store.memberRoot.project;
  // derived values
  const memberIds = workspaceMemberIds;

  if (isWorkspaceLevel) {
    return { memberIds: memberIds ?? [], includeNone: true };
  }

  if (projectId || (projectMemberIds && projectMemberIds.length > 0)) {
    const { getProjectMemberIds } = store.memberRoot.project;
    const _projectMemberIds = projectId ? getProjectMemberIds(projectId, false) : projectMemberIds;
    return {
      memberIds: _projectMemberIds ?? [],
      includeNone: true,
    };
  }

  return { memberIds: [], includeNone: true };
};

export const getTeamProjectColumns = (): IGroupByColumn[] | undefined => undefined;

export const SpreadSheetPropertyIconMap: Record<string, FC<ISvgIcons>> = {
  MembersPropertyIcon: MembersPropertyIcon,
  CalenderDays: CalendarDays,
  DueDatePropertyIcon: DueDatePropertyIcon,
  EstimatePropertyIcon: EstimatePropertyIcon,
  LabelPropertyIcon: LabelPropertyIcon,
  ModuleIcon: ModuleIcon,
  ContrastIcon: CycleIcon,
  PriorityPropertyIcon: PriorityPropertyIcon,
  StartDatePropertyIcon: StartDatePropertyIcon,
  StatePropertyIcon: StatePropertyIcon,
  Link2: LinkIcon,
  Paperclip: Paperclip,
  LayersIcon: LayersIcon,
};

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  assignee: SpreadsheetAssigneeColumn,
  created_on: SpreadsheetCreatedOnColumn,
  due_date: SpreadsheetDueDateColumn,
  estimate: SpreadsheetEstimateColumn,
  labels: SpreadsheetLabelColumn,
  modules: SpreadsheetModuleColumn,
  cycle: SpreadsheetCycleColumn,
  link: SpreadsheetLinkColumn,
  priority: SpreadsheetPriorityColumn,
  start_date: SpreadsheetStartDateColumn,
  state: SpreadsheetStateColumn,
  sub_issue_count: SpreadsheetSubIssueColumn,
  updated_on: SpreadsheetUpdatedOnColumn,
  attachment_count: SpreadsheetAttachmentColumn,
};

/**
 * Returns extra property configs of type "select" that are bound to at least one
 * issue type in the given project. Used to populate dynamic group-by options.
 */
export const useProjectSelectExtraProperties = (projectId?: string): TExtraPropertyConfig[] => {
  const workspaceSlug = store.workspaceRoot.currentWorkspace?.slug;
  if (!workspaceSlug || !projectId) return [];

  const allConfigs = store.extraPropertyConfig.getConfigsByWorkspace(workspaceSlug);
  const selectConfigs = allConfigs.filter((c: TExtraPropertyConfig) => c.type === "select");
  if (selectConfigs.length === 0) return [];

  // Collect all config IDs bound to any issue type in this project
  const projectIssueTypes = store.issueType.getProjectIssueTypes(projectId) ?? [];
  const boundConfigIds = new Set<string>();
  for (const issueType of projectIssueTypes) {
    const configIds = store.issueTypeExtraProperty.getConfigIdsByIssueType(projectId, issueType.id);
    for (const id of configIds) boundConfigIds.add(id);
  }

  return selectConfigs.filter((c: TExtraPropertyConfig) => boundConfigIds.has(c.id));
};

export const useGroupByOptions = (
  options: TIssueGroupByOptions[],
  projectId?: string
): {
  key: TIssueGroupByOptions;
  titleTranslationKey: string;
}[] => {
  const staticOptions = ISSUE_GROUP_BY_OPTIONS.filter((option) => options.includes(option.key));

  // Append dynamic select extra property options
  const selectExtraProps = useProjectSelectExtraProperties(projectId);
  const extraOptions = selectExtraProps.map((config: TExtraPropertyConfig) => ({
    key: `extra_property:${config.key}` as TIssueGroupByOptions,
    titleTranslationKey: config.label, // label is already a display string, not a translation key
  }));

  return [...staticOptions, ...extraOptions];
};
