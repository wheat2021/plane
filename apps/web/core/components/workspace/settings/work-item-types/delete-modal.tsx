"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueType } from "@plane/types";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";
// service
import { IssueTypeService } from "@/services/issue-type.service";

const issueTypeService = new IssueTypeService();

type TDeleteModalProps = {
  issueType: TIssueType;
  onClose: () => void;
  onDeleted: () => void;
};

export function WorkItemTypeDeleteModal({ issueType, onClose, onDeleted }: TDeleteModalProps) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { deleteWorkspaceIssueType } = useIssueType();

  const [usageSummary, setUsageSummary] = useState<{
    affected_projects: number;
    affected_issues: number;
  } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockedProjects, setBlockedProjects] = useState<string[] | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    setIsLoadingSummary(true);
    void issueTypeService
      .getWorkspaceIssueTypeUsage(workspaceSlug, issueType.id)
      .then((data) => setUsageSummary(data))
      .catch(() => setUsageSummary(null))
      .finally(() => setIsLoadingSummary(false));
  }, [workspaceSlug, issueType.id]);

  const handleConfirmDelete = async () => {
    if (!workspaceSlug) return;
    setIsDeleting(true);
    setBlockedProjects(null);
    try {
      const result = await deleteWorkspaceIssueType(workspaceSlug, issueType.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("workspace_settings.settings.work_item_types.delete_success", {
          count: result.migrated_count,
        }),
      });
      onDeleted();
      onClose();
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      if (err?.blocked_projects) {
        setBlockedProjects(err.blocked_projects as string[]);
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error"),
          message: t("common.something_went_wrong"),
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="Close"
        className="fixed inset-0 bg-backdrop transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-xl border border-custom-border-200 bg-custom-background-100 p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-custom-text-100">
                {t("workspace_settings.settings.work_item_types.delete_title")}
              </h3>
              <p className="mt-1 text-sm text-custom-text-300">
                {t("workspace_settings.settings.work_item_types.delete_description", { name: issueType.name })}
              </p>

              {isLoadingSummary ? (
                <div className="mt-3 space-y-1">
                  <div className="h-4 w-full animate-pulse rounded bg-custom-background-80" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-custom-background-80" />
                </div>
              ) : (
                usageSummary && (
                  <div className="mt-3 rounded-md border border-custom-border-200 bg-custom-background-90 p-3">
                    <p className="text-sm text-custom-text-200">
                      {t("workspace_settings.settings.work_item_types.delete_impact", {
                        projects: usageSummary.affected_projects,
                        issues: usageSummary.affected_issues,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-custom-text-400">
                      {t("workspace_settings.settings.work_item_types.delete_migrate_note")}
                    </p>
                  </div>
                )
              )}

              {blockedProjects && (
                <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    {t("workspace_settings.settings.work_item_types.delete_blocked")}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-red-600">
                    {blockedProjects.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleConfirmDelete()}
              loading={isDeleting}
              disabled={isLoadingSummary}
            >
              {t("workspace_settings.settings.work_item_types.confirm_delete")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
