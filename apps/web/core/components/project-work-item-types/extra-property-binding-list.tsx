"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { GripVertical } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueTypeExtraProperty } from "@plane/types";
import { Checkbox, Loader, Sortable, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useIssueTypeExtraProperty } from "@/hooks/store/use-issue-type-extra-property";

type Props = {
  issueTypeId: string;
  isEditable: boolean;
};

type BindingLoadingState = {
  toggle: Set<string>; // configIds being toggled (bound/unbound)
  required: Set<string>; // configIds with required being updated
  reorder: boolean;
};

export const ExtraPropertyBindingList = observer(function ExtraPropertyBindingList({ issueTypeId, isEditable }: Props) {
  // params
  const { workspaceSlug, projectId } = useParams();
  // state
  const [loadingState, setLoadingState] = useState<BindingLoadingState>({
    toggle: new Set(),
    required: new Set(),
    reorder: false,
  });
  // store hooks
  const {
    fetchedMap: configFetchedMap,
    fetchWorkspaceConfigs,
    getConfigsByWorkspace,
    getConfigById,
  } = useExtraPropertyConfig();
  const {
    fetchedMap: bindingFetchedMap,
    fetchBindings,
    getBindings,
    createBinding,
    updateBinding,
    deleteBinding,
  } = useIssueTypeExtraProperty();
  // i18n
  const { t } = useTranslation();

  // derived values
  const wsSlug = workspaceSlug as string;
  const projId = projectId as string;
  const workspaceConfigs = getConfigsByWorkspace(wsSlug);
  const bindings = getBindings(projId, issueTypeId); // sorted by sort_order
  const boundConfigIds = new Set(bindings.map((b) => b.extra_property_config));
  const isConfigFetched = configFetchedMap[wsSlug];
  const isBindingFetched = bindingFetchedMap[projId]?.[issueTypeId];
  // unbound configs (configs not yet selected for this issue type)
  const unboundConfigs = useMemo(
    () => workspaceConfigs.filter((c) => !boundConfigIds.has(c.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceConfigs, bindings]
  );

  useEffect(() => {
    if (wsSlug && !isConfigFetched) {
      void fetchWorkspaceConfigs(wsSlug);
    }
  }, [wsSlug, isConfigFetched, fetchWorkspaceConfigs]);

  useEffect(() => {
    if (wsSlug && projId && issueTypeId && !isBindingFetched) {
      void fetchBindings(wsSlug, projId, issueTypeId);
    }
  }, [wsSlug, projId, issueTypeId, isBindingFetched, fetchBindings]);

  const handleToggleBinding = async (configId: string) => {
    if (!isEditable || loadingState.toggle.has(configId)) return;

    setLoadingState((prev) => ({ ...prev, toggle: new Set(prev.toggle).add(configId) }));
    try {
      if (boundConfigIds.has(configId)) {
        // Find the binding to delete
        const bindingToDelete = bindings.find((b) => b.extra_property_config === configId);
        if (bindingToDelete) {
          await deleteBinding(wsSlug, projId, issueTypeId, bindingToDelete.id);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("project_settings.work_item_types.extra_properties.unbind_success"),
          });
        }
      } else {
        // Create new binding
        await createBinding(wsSlug, projId, issueTypeId, { extra_property_config: configId });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_settings.work_item_types.extra_properties.bind_success"),
        });
      }
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.something_went_wrong"),
      });
    } finally {
      setLoadingState((prev) => {
        const next = new Set(prev.toggle);
        next.delete(configId);
        return { ...prev, toggle: next };
      });
    }
  };

  const handleToggleRequired = async (configId: string, bindingId: string, currentValue: boolean) => {
    if (!isEditable || loadingState.required.has(configId)) return;

    setLoadingState((prev) => ({ ...prev, required: new Set(prev.required).add(configId) }));
    try {
      await updateBinding(wsSlug, projId, issueTypeId, bindingId, { is_required: !currentValue });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.work_item_types.extra_properties.required_update_success"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.something_went_wrong"),
      });
    } finally {
      setLoadingState((prev) => {
        const next = new Set(prev.required);
        next.delete(configId);
        return { ...prev, required: next };
      });
    }
  };

  const handleReorder = useCallback(
    async (newBindings: TIssueTypeExtraProperty[]) => {
      if (!isEditable || loadingState.reorder) return;
      setLoadingState((prev) => ({ ...prev, reorder: true }));
      try {
        await Promise.all(
          newBindings.map((binding, index) =>
            updateBinding(wsSlug, projId, issueTypeId, binding.id, { sort_order: index })
          )
        );
      } catch (_error) {
        setToast({ type: TOAST_TYPE.ERROR, title: t("common.something_went_wrong") });
      } finally {
        setLoadingState((prev) => ({ ...prev, reorder: false }));
      }
    },
    [wsSlug, projId, issueTypeId, isEditable, loadingState.reorder, updateBinding, t]
  );

  if (!isConfigFetched || !isBindingFetched) {
    return (
      <div className="border-t border-custom-border-200 px-4 py-3">
        <Loader className="flex flex-col gap-2">
          <Loader.Item height="24px" width="100%" />
          <Loader.Item height="24px" width="100%" />
        </Loader>
      </div>
    );
  }

  if (workspaceConfigs.length === 0) {
    return (
      <div className="border-t border-custom-border-200 px-4 py-3">
        <p className="text-sm text-custom-text-300">
          {t("project_settings.work_item_types.extra_properties.empty_state")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-custom-border-200 px-4 py-3">
      <p className="mb-2 text-sm font-medium text-custom-text-200">
        {t("project_settings.work_item_types.extra_properties.title")}
      </p>
      <div className="flex flex-col gap-1">
        {/* Bound (selected) items — sortable */}
        {bindings.length > 0 && (
          <Sortable
            data={bindings}
            onChange={(newBindings) => void handleReorder(newBindings)}
            keyExtractor={(binding) => binding.id}
            id={`extra-property-bindings-${issueTypeId}`}
            render={(binding) => {
              const config = getConfigById(binding.extra_property_config);
              if (!config) return null;
              const isToggleLoading = loadingState.toggle.has(config.id);
              const isRequiredLoading = loadingState.required.has(config.id);
              return (
                <div
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-custom-background-80 ${
                    !isEditable ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <span className={`flex items-center gap-2 flex-1 ${isEditable ? "cursor-pointer" : ""}`}>
                    {isEditable && (
                      <GripVertical className="size-4 text-custom-text-300 cursor-grab active:cursor-grabbing flex-shrink-0" />
                    )}
                    <Checkbox
                      checked
                      onChange={() => void handleToggleBinding(config.id)}
                      disabled={!isEditable || isToggleLoading}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{config.label}</span>
                      <span className="text-xs text-custom-text-300">{config.type}</span>
                    </div>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-custom-text-300">
                      {t("project_settings.work_item_types.extra_properties.required")}
                    </span>
                    <ToggleSwitch
                      value={binding.is_required}
                      onChange={() => void handleToggleRequired(config.id, binding.id, binding.is_required)}
                      disabled={!isEditable || isRequiredLoading}
                      size="sm"
                    />
                  </div>
                </div>
              );
            }}
          />
        )}
        {/* Unbound (unselected) items */}
        {unboundConfigs.map((config) => {
          const isToggleLoading = loadingState.toggle.has(config.id);
          return (
            <div
              key={config.id}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-custom-background-80 ${
                !isEditable ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              <span className={`flex items-center gap-2 flex-1 ${isEditable ? "cursor-pointer" : ""}`}>
                {isEditable && <div className="size-4 flex-shrink-0" />}
                <Checkbox
                  checked={false}
                  onChange={() => void handleToggleBinding(config.id)}
                  disabled={!isEditable || isToggleLoading}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{config.label}</span>
                  <span className="text-xs text-custom-text-300">{config.type}</span>
                </div>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
