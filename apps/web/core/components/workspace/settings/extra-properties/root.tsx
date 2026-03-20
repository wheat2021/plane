"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// components
import { ExtraPropertyForm } from "./form";
import { ExtraPropertyItem } from "./item";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";

export const ExtraPropertySettingsRoot = observer(function ExtraPropertySettingsRoot() {
  // params
  const { workspaceSlug } = useParams();
  // state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  // store hooks
  const { fetchedMap, fetchWorkspaceConfigs, getConfigsByWorkspace } = useExtraPropertyConfig();
  // i18n
  const { t } = useTranslation();
  // derived values
  const configs = getConfigsByWorkspace(workspaceSlug as string);
  const isFetched = fetchedMap[workspaceSlug as string];

  useEffect(() => {
    if (workspaceSlug && !isFetched) {
      void fetchWorkspaceConfigs(workspaceSlug);
    }
  }, [workspaceSlug, isFetched, fetchWorkspaceConfigs]);

  const handleEdit = (configId: string) => {
    setEditingConfigId(configId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingConfigId(null);
  };

  const handleOpenCreate = () => {
    setEditingConfigId(null);
    setIsFormOpen(true);
  };

  if (!isFetched) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Loader className="flex flex-col gap-4">
          <Loader.Item height="60px" width="100%" />
          <Loader.Item height="60px" width="100%" />
          <Loader.Item height="60px" width="100%" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-4">
        <div>
          <h3 className="text-lg font-medium">{t("workspace_settings.settings.extra_properties.title")}</h3>
          <p className="text-sm text-custom-text-200">
            {t("workspace_settings.settings.extra_properties.description")}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("workspace_settings.settings.extra_properties.add_property")}
        </Button>
      </div>

      {isFormOpen && editingConfigId === null && (
        <div className="px-4">
          <ExtraPropertyForm configId={null} onClose={handleCloseForm} />
        </div>
      )}

      {configs.length === 0 && !isFormOpen ? (
        <div className="flex flex-col items-center justify-center py-10 text-custom-text-300">
          <p>{t("workspace_settings.settings.extra_properties.empty_state")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {configs.map((config) => (
            <div key={config.id} className="flex flex-col gap-2">
              <ExtraPropertyItem config={config} onEdit={() => handleEdit(config.id)} />
              {isFormOpen && editingConfigId === config.id && (
                <ExtraPropertyForm configId={config.id} onClose={handleCloseForm} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
