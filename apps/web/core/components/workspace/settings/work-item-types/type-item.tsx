"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { WorkItemTypeForm } from "./type-form";
import { WorkItemTypeDeleteModal } from "./delete-modal";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";

type TTypeItemProps = {
  issueTypeId: string;
  dragHandleProps?: Record<string, unknown>;
};

export const WorkItemTypeItem = observer(function WorkItemTypeItem({ issueTypeId, dragHandleProps }: TTypeItemProps) {
  const { getIssueTypeById } = useIssueType();
  const issueType = getIssueTypeById(issueTypeId);
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!issueType) return null;

  if (isEditing) {
    return <WorkItemTypeForm issueType={issueType} onClose={() => setIsEditing(false)} />;
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-3">
        {/* Drag handle */}
        <div
          className="flex-shrink-0 cursor-grab text-custom-text-400 hover:text-custom-text-200 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          <Logo logo={issueType.logo_props} size={18} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-custom-text-100">{issueType.name}</span>
            {issueType.is_system && (
              <span className="rounded bg-custom-background-80 px-2 py-0.5 text-xs text-custom-text-300">
                {t("common.system")}
              </span>
            )}
          </div>
          {issueType.description && (
            <p className="mt-0.5 truncate text-sm text-custom-text-300">{issueType.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
            title={t("common.edit")}
          >
            <Pencil className="size-4" />
          </button>
          {!issueType.is_system && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded p-1 text-custom-text-400 hover:bg-red-50 hover:text-red-500"
              title={t("common.delete")}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <WorkItemTypeDeleteModal
          issueType={issueType}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
});
