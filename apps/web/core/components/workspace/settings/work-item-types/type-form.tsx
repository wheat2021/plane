"use client";

import { useState } from "react";
import { useParams } from "react-router";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueType } from "@plane/types";
import { Button, Input, TextArea } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { IconColorPicker } from "./icon-color-picker";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

type TTypeFormProps = {
  issueType?: TIssueType;
  onClose: () => void;
};

type FormState = {
  name: string;
  description: string;
  iconName: string;
  iconColor: string;
};

export function WorkItemTypeForm({ issueType, onClose }: TTypeFormProps) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { createWorkspaceIssueType, updateWorkspaceIssueType } = useIssueType();

  const isEditMode = !!issueType;
  const isSystem = issueType?.is_system ?? false;

  const [form, setForm] = useState<FormState>({
    name: issueType?.name ?? "",
    description: issueType?.description ?? "",
    iconName: issueType?.logo_props?.icon?.name ?? "circle-check",
    iconColor: issueType?.logo_props?.icon?.color ?? "#6b7280",
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!workspaceSlug) return;

    if (!form.name.trim()) {
      setNameError(t("workspace_settings.settings.work_item_types.form.name_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<TIssueType> = {
        description: form.description,
        logo_props: {
          icon: { name: form.iconName, color: form.iconColor },
        },
      };
      if (!isSystem) {
        payload.name = form.name;
      }

      if (isEditMode && issueType) {
        await updateWorkspaceIssueType(workspaceSlug, issueType.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("workspace_settings.settings.work_item_types.update_success"),
        });
      } else {
        await createWorkspaceIssueType(workspaceSlug, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("workspace_settings.settings.work_item_types.create_success"),
        });
      }
      onClose();
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      if (err?.name) {
        setNameError(String(Array.isArray(err.name) ? err.name[0] : err.name));
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error"),
          message: t("common.something_went_wrong"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview icon
  const iconKey = toPascalCase(form.iconName);
  const PreviewIcon = (icons as unknown as Record<string, LucideIcon>)[iconKey];

  return (
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <div className="flex flex-col gap-4">
        {/* Icon preview row */}
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-custom-border-200"
            style={{ backgroundColor: `${form.iconColor}20` }}
          >
            {PreviewIcon ? (
              <PreviewIcon size={18} color={form.iconColor} strokeWidth={2} />
            ) : (
              <span className="text-xs text-custom-text-300">?</span>
            )}
          </div>
          <div className="flex-1">
            {isSystem ? (
              <div>
                <span className="text-sm font-medium text-custom-text-100">{form.name}</span>
                <p className="text-xs text-custom-text-400">
                  {t("workspace_settings.settings.work_item_types.system_name_readonly")}
                </p>
              </div>
            ) : (
              <div>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    setNameError(null);
                  }}
                  placeholder={t("workspace_settings.settings.work_item_types.form.name_placeholder")}
                  className="w-full"
                  hasError={!!nameError}
                />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("workspace_settings.settings.work_item_types.form.description")}
          </label>
          <TextArea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("workspace_settings.settings.work_item_types.form.description_placeholder")}
            className="w-full"
            rows={2}
          />
        </div>

        {/* Icon + Color Picker */}
        <IconColorPicker
          value={{ name: form.iconName, color: form.iconColor }}
          onChange={({ name, color }) => setForm((prev) => ({ ...prev, iconName: name, iconColor: color }))}
        />

        {/* Form actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => void handleSubmit()} loading={isSubmitting}>
            {isEditMode ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
