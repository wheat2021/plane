import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { observer } from "mobx-react";
// types
import type { TExtraPropertyConfig, TIssue, TIssueTypeExtraProperty } from "@plane/types";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useIssueTypeExtraProperty } from "@/hooks/store/use-issue-type-extra-property";
// utils
import { cn } from "@plane/utils";
// components
import { ExtraPropertyControl } from "@/components/issues/extra-properties/extra-property-control";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

export const WorkItemModalAdditionalProperties = observer((props: TWorkItemModalAdditionalPropertiesProps) => {
  const { projectId, workspaceSlug } = props;

  // form context
  const { watch } = useFormContext<TIssue>();
  const typeId = watch("type_id");

  // modal context
  const { issuePropertyValues, setIssuePropertyValues, issuePropertyValueErrors, setIssuePropertyValueErrors } =
    useIssueModal();

  // store hooks
  const { fetchedMap: configFetchedMap, fetchWorkspaceConfigs, getConfigById } = useExtraPropertyConfig();
  const { fetchedMap: bindingFetchedMap, fetchBindings, getBindings } = useIssueTypeExtraProperty();

  // Fetch workspace configs and bindings when needed
  useEffect(() => {
    if (workspaceSlug && !configFetchedMap[workspaceSlug]) {
      fetchWorkspaceConfigs(workspaceSlug).catch(console.error);
    }
  }, [workspaceSlug, configFetchedMap, fetchWorkspaceConfigs]);

  useEffect(() => {
    if (workspaceSlug && projectId && typeId && !bindingFetchedMap[projectId]?.[typeId]) {
      fetchBindings(workspaceSlug, projectId, typeId).catch(console.error);
    }
  }, [workspaceSlug, projectId, typeId, bindingFetchedMap, fetchBindings]);

  // Reset values when type changes
  useEffect(() => {
    setIssuePropertyValues({});
    setIssuePropertyValueErrors({});
  }, [typeId, setIssuePropertyValues, setIssuePropertyValueErrors]);

  // Get configs via bindings
  const bindings = getBindings(projectId, typeId);

  // Filter and sort configs
  const configsWithBindings = (bindings || [])
    .map((binding) => ({
      binding,
      config: getConfigById(binding.extra_property_config),
    }))
    .filter((item): item is { binding: TIssueTypeExtraProperty; config: TExtraPropertyConfig } => !!item.config)
    .sort((a, b) => a.binding.sort_order - b.binding.sort_order);

  // Initialize default values when configs change
  useEffect(() => {
    if (configsWithBindings.length > 0) {
      setIssuePropertyValues((prev) => {
        const newValues = { ...prev };
        let hasChanges = false;
        configsWithBindings.forEach(({ config }) => {
          if (config.default_value !== undefined && config.default_value !== null && prev[config.key] === undefined) {
            newValues[config.key] = config.default_value;
            hasChanges = true;
          }
        });
        return hasChanges ? newValues : prev;
      });
    }
  }, [configsWithBindings, setIssuePropertyValues]);

  // Handler for updating extra properties in state
  const handleChange = (key: string, value: string | string[] | boolean | null) => {
    setIssuePropertyValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Don't render if no configs
  if (configsWithBindings.length === 0) {
    return null;
  }

  return (
    <div className="px-5 py-3 space-y-4 border-t border-subtle mt-4">
      <h4 className="text-caption-md-medium text-secondary">Additional Properties</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {configsWithBindings.map(({ binding, config }) => (
          <div key={config.id} className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-body-xs-medium text-secondary">{config.label}</span>
              {binding.is_required && <span className="text-red-500">*</span>}
            </div>
            <div
              className={cn(
                "rounded border bg-surface-2 transition-all",
                issuePropertyValueErrors[config.key] ? "border-red-500" : "border-subtle hover:border-tertiary"
              )}
            >
              <ExtraPropertyControl
                config={config}
                value={issuePropertyValues[config.key] ?? config.default_value ?? null}
                onChange={(value) => handleChange(config.key, value)}
                workspaceSlug={workspaceSlug}
                projectId={projectId ?? ""}
              />
            </div>
            {issuePropertyValueErrors[config.key] && (
              <span className="text-[10px] text-red-500">{issuePropertyValueErrors[config.key]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
