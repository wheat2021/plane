import { observer } from "mobx-react";
// plane imports
import type { TIssueIdentifierProps, TIssueTypeIdentifier } from "@plane/types";
// components
import { IssueTypeDropdown } from "@/components/dropdowns/issue-type";
import { getIssueTypeIcon, getDefaultIssueTypeIcon } from "@/components/dropdowns/issue-type-icon";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueType } from "@/hooks/store/use-issue-type";
import { useProject } from "@/hooks/store/use-project";

export const IssueIdentifier = observer(function IssueIdentifier(props: TIssueIdentifierProps) {
  const { projectId, variant, size, displayProperties, enableClickToCopyIdentifier = false } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;
  const shouldRenderIssueType = displayProperties ? displayProperties.issue_type : true;

  if (!shouldRenderIssueID) return null;

  const iconSize = size === "xs" ? 12 : size === "sm" ? 14 : size === "md" ? 16 : 18;

  return (
    <div className="shrink-0 flex items-center gap-2">
      {shouldRenderIssueType &&
        (issueTypeId ? (
          <IssueTypeIconDisplay issueTypeId={issueTypeId} size={size} />
        ) : (
          <span className="flex-shrink-0">{getDefaultIssueTypeIcon(iconSize)}</span>
        ))}
      <IdentifierText
        identifier={`${projectIdentifier}-${issueSequenceId}`}
        enableClickToCopyIdentifier={enableClickToCopyIdentifier}
        variant={variant}
        size={size}
      />
    </div>
  );
});

type TIssueTypeIconDisplayProps = {
  issueTypeId: string;
  size?: "xs" | "sm" | "md" | "lg";
};

const IssueTypeIconDisplay = observer(function IssueTypeIconDisplay(props: TIssueTypeIconDisplayProps) {
  const { issueTypeId, size = "sm" } = props;
  const { getIssueTypeById } = useIssueType();
  const issueType = getIssueTypeById(issueTypeId);

  if (!issueType) return null;

  const iconSize = size === "xs" ? 12 : size === "sm" ? 14 : size === "md" ? 16 : 18;

  return (
    <span className="flex-shrink-0">
      {getIssueTypeIcon(issueType.name, issueType.logo_props?.icon?.color, iconSize)}
    </span>
  );
});

export const IssueTypeIdentifier = observer(function IssueTypeIdentifier(props: TIssueTypeIdentifier) {
  const { issueTypeId, issueId, projectId, workspaceSlug, size = "sm", disabled = false } = props;
  // store hooks
  const {
    issue: { updateIssue },
  } = useIssueDetail();
  const { getIssueTypeById } = useIssueType();

  const issueType = issueTypeId ? getIssueTypeById(issueTypeId) : null;
  const iconSize = size === "xs" ? 12 : size === "sm" ? 14 : size === "md" ? 16 : 18;

  // If we don't have the required props for editing, render read-only
  const isReadOnly = !workspaceSlug || !projectId || !issueId;

  const handleChange = (value: string | null) => {
    if (isReadOnly) return;
    void updateIssue(workspaceSlug, projectId, issueId, { type_id: value });
  };

  // Read-only mode: just display the icon
  if (isReadOnly) {
    return (
      <span className="flex-shrink-0">
        {issueType
          ? getIssueTypeIcon(issueType.name, issueType.logo_props?.icon?.color, iconSize)
          : getDefaultIssueTypeIcon(iconSize)}
      </span>
    );
  }

  // Editable mode: render dropdown
  return (
    <IssueTypeDropdown
      value={issueTypeId ?? null}
      onChange={handleChange}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      disabled={disabled}
      buttonVariant="border-without-text"
      showTooltip
      button={
        <span className="flex-shrink-0 cursor-pointer">
          {issueType
            ? getIssueTypeIcon(issueType.name, issueType.logo_props?.icon?.color, iconSize)
            : getDefaultIssueTypeIcon(iconSize)}
        </span>
      }
    />
  );
});
