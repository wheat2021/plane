import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EFileAssetType } from "@plane/types";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { getTextContent } from "@plane/utils";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useDefaultPropertyConfig } from "@/hooks/store/use-default-property-config";
// components
import { DefaultPropertyTooltip } from "@/components/issues/extra-properties/default-property-tooltip";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe/duplicate-popover";
import { IssueTypeSwitcher } from "@/plane-web/components/issues/issue-details/issue-type-switcher";
// plane web hooks
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { WorkItemVersionService } from "@/services/issue";
// local components
import type { TIssueOperations } from "../issue-detail";
import { IssueParentDetail } from "../issue-detail/parent";
import { IssueReaction } from "../issue-detail/reactions";
import { IssueTitleInput } from "../title-input";
// services init
const workItemVersionService = new WorkItemVersionService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isArchived: boolean;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
};

export const PeekOverviewIssueDetails = observer(function PeekOverviewIssueDetails(props: Props) {
  const { editorRef, workspaceSlug, issueId, issueOperations, disabled, isArchived, isSubmitting, setIsSubmitting } =
    props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { getDescription } = useDefaultPropertyConfig();
  // reload confirmation
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/require-await
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    projectDetails?.workspace.toString(),
    projectDetails?.id,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  if (!issue || !issue.project_id) return <></>;

  const mainPropAppend = (propertyKey: string, align?: "left" | "right") => {
    if (!issue.type_id) return null;
    const desc = getDescription(workspaceSlug, issue.type_id, propertyKey);
    if (!desc) return null;
    return <DefaultPropertyTooltip description={desc} align={align} />;
  };

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

  return (
    <div className="space-y-2">
      {issue.parent_id && (
        <IssueParentDetail
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issueId}
          issue={issue}
          issueOperations={issueOperations}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <IssueTypeSwitcher issueId={issueId} disabled={isArchived || disabled} />
        {duplicateIssues?.length > 0 && (
          <DeDupeIssuePopoverRoot
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            rootIssueId={issueId}
            issues={duplicateIssues}
            issueOperations={issueOperations}
          />
        )}
      </div>
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <IssueTitleInput
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            issueId={issue.id}
            isSubmitting={isSubmitting}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            issueOperations={issueOperations}
            disabled={disabled || isArchived}
            value={issue.name}
            containerClassName="-ml-3"
          />
        </div>
        <div className="mt-1 flex-shrink-0">{mainPropAppend("title", "right")}</div>
      </div>

      <DescriptionInput
        issueSequenceId={issue.sequence_id}
        containerClassName="-ml-3 border-none"
        disabled={disabled || isArchived}
        editorRef={editorRef}
        entityId={issue.id}
        fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
        initialValue={issueDescription}
        onSubmit={async (value, isMigrationUpdate) => {
          if (!issue.id || !issue.project_id) return;
          await issueOperations.update(workspaceSlug, issue.project_id, issue.id, {
            description_html: value,
            ...(isMigrationUpdate ? { skip_activity: "true" } : {}),
          });
        }}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        projectId={issue.project_id}
        workspaceSlug={workspaceSlug}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentUser && (
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={issue.project_id}
              issueId={issueId}
              currentUser={currentUser}
              disabled={isArchived}
            />
          )}
          <div className="mt-4">{mainPropAppend("description")}</div>
        </div>
        {!disabled && (
          <DescriptionVersionsRoot
            className="flex-shrink-0"
            entityInformation={{
              createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
              createdByDisplayName: getUserDetails(issue.created_by ?? "")?.display_name ?? "",
              id: issueId,
              isRestoreDisabled: disabled || isArchived,
            }}
            fetchHandlers={{
              listDescriptionVersions: (issueId) =>
                workItemVersionService.listDescriptionVersions(
                  workspaceSlug,
                  issue.project_id?.toString() ?? "",
                  issueId
                ),
              retrieveDescriptionVersion: (issueId, versionId) =>
                workItemVersionService.retrieveDescriptionVersion(
                  workspaceSlug,
                  issue.project_id?.toString() ?? "",
                  issueId,
                  versionId
                ),
            }}
            handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
            projectId={issue.project_id}
            workspaceSlug={workspaceSlug}
          />
        )}
      </div>
    </div>
  );
});
