"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TExtraPropertyConfig } from "@plane/types";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { DeleteConfirmationModal } from "./delete-modal";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";

type Props = {
  config: TExtraPropertyConfig;
  onEdit: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Textarea",
  select: "Select",
  multiselect: "Multi-Select",
  checkbox: "Checkbox",
  markdown: "Markdown",
};

export const ExtraPropertyItem = observer(function ExtraPropertyItem({ config, onEdit }: Props) {
  // params
  const { workspaceSlug } = useParams();
  // state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // store hooks
  const { deleteConfig } = useExtraPropertyConfig();
  // i18n
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (!workspaceSlug) return;

    setIsDeleting(true);
    try {
      await deleteConfig(workspaceSlug, config.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.extra_properties.delete_success"),
      });
      setShowDeleteModal(false);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.extra_properties.delete_error"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-custom-border-200 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{config.label}</span>
            <span className="rounded bg-custom-background-80 px-2 py-0.5 text-xs text-custom-text-300">
              {config.key}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-custom-text-300">
            <span>{TYPE_LABELS[config.type] || config.type}</span>
            {config.description && <span>• {config.description}</span>}
            {(config.type === "select" || config.type === "multiselect") && config.options && (
              <span>• {config.options.length} options</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="link-neutral" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="link-neutral" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="size-4 text-red-500" />
          </Button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void handleDelete()}
        isDeleting={isDeleting}
        propertyLabel={config.label}
      />
    </>
  );
});
