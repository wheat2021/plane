"use client";

import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  propertyLabel: string;
};

export const DeleteConfirmationModal = observer(function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  propertyLabel,
}: Props) {
  const { t } = useTranslation();

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="size-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium">
              {t("workspace_settings.settings.extra_properties.delete_modal.title")}
            </h3>
            <p className="text-sm text-custom-text-200">
              {t("workspace_settings.settings.extra_properties.delete_modal.description", { name: propertyLabel })}
            </p>
          </div>
        </div>

        <p className="text-sm text-custom-text-300">
          {t("workspace_settings.settings.extra_properties.delete_modal.warning")}
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isDeleting}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={isDeleting}>
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
