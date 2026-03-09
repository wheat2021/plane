import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { HashPropertyIcon, DropdownPropertyIcon, BooleanPropertyIcon } from "@plane/propel/icons";
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

const getPropertyIcon = (type: string) => {
  switch (type) {
    case "select":
    case "multiselect":
      return DropdownPropertyIcon;
    case "checkbox":
      return BooleanPropertyIcon;
    default:
      return HashPropertyIcon;
  }
};

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
  const {
    fetchedMap: bindingFetchedMap,
    fetchBindings,
    getConfigIdsByIssueType,
    getBindings,
    isConditionMet,
  } = useIssueTypeExtraProperty();

  // Ensure configs are loaded when component mounts
  React.useEffect(() => {
    if (workspaceSlug) {
      void fetchWorkspaceConfigs(workspaceSlug.toString());
    }
  }, [workspaceSlug, fetchWorkspaceConfigs]);

  // Ensure bindings are loaded for this issue's type
  React.useEffect(() => {
    const wsSlug = workspaceSlug?.toString();
    const projId = projectId?.toString();
    const typeId = issue.type_id;
    if (wsSlug && projId && typeId && !bindingFetchedMap[projId]?.[typeId]) {
      void fetchBindings(wsSlug, projId, typeId);
    }
  }, [workspaceSlug, projectId, issue.type_id, bindingFetchedMap, fetchBindings]);

  const validConfigIds =
    !projectId || !issue.type_id
      ? new Set<string>()
      : new Set(getConfigIdsByIssueType(projectId.toString(), issue.type_id));

  const selectedConfigIds = useMemo(() => {
    if (!extraDisplayProperties) return [];
    return Object.entries(extraDisplayProperties)
      .filter(([_, isSelected]) => isSelected)
      .map(([configId]) => configId);
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
        const currentValue = issue.extra_properties?.[config.key] ?? null;

        // Check condition met for condition bindings
        const projId = projectId?.toString();
        const typeId = issue.type_id;
        let conditionSatisfied = true;
        if (isValid && projId && typeId) {
          const bindings = getBindings(projId, typeId);
          const binding = bindings.find((b) => b.extra_property_config === configId);
          if (binding?.condition_config) {
            conditionSatisfied = isConditionMet(projId, typeId, binding.id, issue.extra_properties);
          }
        }

        if (!isValid || !conditionSatisfied) {
          const PropertyIcon = getPropertyIcon(config.type);
          return (
            <Tooltip
              key={configId}
              tooltipContent={t("issue.display.extra_properties.not_available", { propertyName: config.label })}
              isMobile={isMobile}
            >
              <div
                className={cn(
                  "flex h-5 flex-shrink-0 items-center justify-center rounded-sm",
                  "opacity-40 cursor-not-allowed"
                )}
              >
                <PropertyIcon className="h-3 w-3 flex-shrink-0 text-secondary" />
              </div>
            </Tooltip>
          );
        }

        return (
          <CompactExtraPropertyControl
            key={configId}
            config={config}
            value={currentValue}
            onChange={(value) => void handlePropertyChange(config, value)}
            disabled={disabled}
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
          />
        );
      })}
    </>
  );
});
