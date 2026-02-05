import { useState } from "react";
import { observer } from "mobx-react";
import { Star } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueType, TProjectIssueType } from "@plane/types";
import { ToggleSwitch, Tooltip } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { getIssueTypeIcon } from "@/components/dropdowns/issue-type-icon";

type TWorkItemTypeItemProps = {
  issueType: TIssueType;
  projectIssueType: TProjectIssueType | undefined;
  isEditable: boolean;
  onEnable: (issueTypeId: string) => Promise<void>;
  onDisable: (projectIssueTypeId: string) => Promise<void>;
  onSetDefault: (projectIssueTypeId: string) => Promise<void>;
};

export const WorkItemTypeItem = observer(function WorkItemTypeItem(props: TWorkItemTypeItemProps) {
  const { issueType, projectIssueType, isEditable, onEnable, onDisable, onSetDefault } = props;
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const isEnabled = !!projectIssueType;
  const isDefault = projectIssueType?.is_default ?? false;

  const handleToggle = async () => {
    if (!isEditable || isLoading) return;

    setIsLoading(true);
    try {
      if (isEnabled && projectIssueType) {
        await onDisable(projectIssueType.id);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("project_settings.work_item_types.disabled_success"),
        });
      } else {
        await onEnable(issueType.id);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("project_settings.work_item_types.enabled_success"),
        });
      }
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: t("common.something_went_wrong"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!isEditable || !isEnabled || !projectIssueType || isDefault || isLoading) return;

    setIsLoading(true);
    try {
      await onSetDefault(projectIssueType.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("project_settings.work_item_types.default_success"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: t("common.something_went_wrong"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const iconColor = issueType.logo_props?.icon?.color;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getIssueTypeIcon(issueType.name, iconColor, 18)}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-custom-text-100">{issueType.name}</span>
            {isDefault && (
              <span className="rounded bg-custom-primary-100/20 px-2 py-0.5 text-xs text-custom-primary-100">
                {t("common.default")}
              </span>
            )}
          </div>
          {issueType.description && <p className="text-sm text-custom-text-300">{issueType.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isEnabled && !isDefault && isEditable && (
          <Tooltip tooltipContent={t("project_settings.work_item_types.set_as_default")}>
            <button
              type="button"
              onClick={() => void handleSetDefault()}
              disabled={isLoading}
              className="flex items-center gap-1 text-sm text-custom-text-300 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Star className="size-4" />
            </button>
          </Tooltip>
        )}
        <ToggleSwitch
          value={isEnabled}
          onChange={() => void handleToggle()}
          disabled={!isEditable || isLoading}
          size="sm"
        />
      </div>
    </div>
  );
});
