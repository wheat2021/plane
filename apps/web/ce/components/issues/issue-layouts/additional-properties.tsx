import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type {
  IIssueDisplayProperties,
  TExtraDisplayProperties,
  TExtraPropertyConfig,
  TExtraPropertyValue,
  TIssue,
} from "@plane/types";
import { cn } from "@plane/utils";
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useIssueTypeExtraProperty } from "@/hooks/store/use-issue-type-extra-property";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { CompactExtraPropertyControl } from "@/components/issues/extra-properties/compact-controls/compact-extra-property-control";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  extraDisplayProperties?: TExtraDisplayProperties;
  issue: TIssue;
  updateIssue?: (projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>;
  disabled?: boolean;
};

export const WorkItemLayoutAdditionalProperties = observer(function WorkItemLayoutAdditionalProperties(
  props: TWorkItemLayoutAdditionalProperties
) {
  const { extraDisplayProperties, issue, updateIssue, disabled = false } = props;
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { isMobile } = usePlatformOS();

  const { getConfigById, fetchWorkspaceConfigs } = useExtraPropertyConfig();
  const { getConfigIdsByIssueType } = useIssueTypeExtraProperty();

  // Ensure configs are loaded when component mounts
  React.useEffect(() => {
    if (workspaceSlug) {
      fetchWorkspaceConfigs(workspaceSlug.toString());
    }
  }, [workspaceSlug, fetchWorkspaceConfigs]);

  const validConfigIds = useMemo(() => {
    if (!projectId || !issue.type_id) return new Set<string>();
    return new Set(getConfigIdsByIssueType(projectId.toString(), issue.type_id));
  }, [projectId, issue.type_id, getConfigIdsByIssueType]);

  const selectedConfigIds = useMemo(() => {
    if (!extraDisplayProperties) {
      console.log('[WorkItemLayoutAdditionalProperties] no extraDisplayProperties');
      return [];
    }
    const ids = Object.entries(extraDisplayProperties)
      .filter(([_, isSelected]) => isSelected)
      .map(([configId]) => configId);
    console.log('[WorkItemLayoutAdditionalProperties] selectedConfigIds:', {
      extraDisplayProperties,
      selectedConfigIds: ids,
    });
    return ids;
  }, [extraDisplayProperties]);

  const handlePropertyChange = useCallback(
    async (config: TExtraPropertyConfig, value: TExtraPropertyValue) => {
      if (!updateIssue || !issue.project_id) return;
      const updatedExtraProperties = {
        ...issue.extra_properties,
        [config.key]: value,
      };
      await updateIssue(issue.project_id, issue.id, { extra_properties: updatedExtraProperties });
    },
    [updateIssue, issue]
  );

  if (selectedConfigIds.length === 0) {
    return null;
  }

  return (
    <>
      {selectedConfigIds.map((configId) => {
        const config = getConfigById(configId);
        if (!config) return null;

        const isValid = validConfigIds.has(configId);
        const currentValue = issue.extra_properties?.[config.key] ?? config.default_value ?? null;

        if (!isValid) {
          return (
            <Tooltip
              key={configId}
              tooltipContent={t("issue.display.extra_properties.not_available")}
              isMobile={isMobile}
            >
              <div
                className={cn(
                  "flex h-5 flex-shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-2 py-1",
                  "opacity-40 cursor-not-allowed bg-layer-2"
                )}
              >
                <span className="text-caption-sm-regular text-secondary truncate max-w-20">{config.label}</span>
              </div>
            </Tooltip>
          );
        }

        return (
          <CompactExtraPropertyControl
            key={configId}
            config={config}
            value={currentValue}
            onChange={(value) => handlePropertyChange(config, value)}
            disabled={disabled}
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
          />
        );
      })}
    </>
  );
});
