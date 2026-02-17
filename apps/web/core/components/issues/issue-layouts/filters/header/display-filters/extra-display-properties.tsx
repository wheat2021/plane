import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import type { TExtraDisplayProperties } from "@plane/types";
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { FilterHeader } from "../helpers/filter-header";

type Props = {
  extraDisplayProperties: TExtraDisplayProperties | undefined;
  handleUpdate: (updatedExtraDisplayProperties: TExtraDisplayProperties) => void;
};

export const FilterExtraDisplayProperties = observer(function FilterExtraDisplayProperties(props: Props) {
  const { extraDisplayProperties, handleUpdate } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const { getConfigsByWorkspace, fetchWorkspaceConfigs } = useExtraPropertyConfig();

  React.useEffect(() => {
    if (workspaceSlug) {
      fetchWorkspaceConfigs(workspaceSlug.toString());
    }
  }, [workspaceSlug, fetchWorkspaceConfigs]);

  const configs = getConfigsByWorkspace(workspaceSlug?.toString());

  if (!configs || configs.length === 0) {
    return null;
  }

  return (
    <>
      <FilterHeader
        title={t("issue.display.extra_properties.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {configs.map((config) => {
            const isSelected = extraDisplayProperties?.[config.id] ?? false;
            return (
              <button
                key={config.id}
                type="button"
                className={`rounded-sm border px-2 py-0.5 text-11 transition-all ${
                  isSelected
                    ? "border-accent-strong bg-accent-primary text-on-color"
                    : "border-subtle hover:bg-layer-1"
                }`}
                onClick={() =>
                  handleUpdate({
                    ...extraDisplayProperties,
                    [config.id]: !isSelected,
                  })
                }
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
});
