import type { FC } from "react";
import { observer } from "mobx-react";
// icons
import { HashPropertyIcon, BooleanPropertyIcon, DropdownPropertyIcon } from "@plane/propel/icons";
// types
import type { TExtraPropertyConfig, TExtraPropertyValue, TIssueExtraProperties } from "@plane/types";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { ExtraPropertyControl } from "./extra-property-control";

interface IExtraPropertyRenderer {
  configs: TExtraPropertyConfig[];
  values: TIssueExtraProperties | undefined;
  onChange: (key: string, value: TExtraPropertyValue) => void;
  isEditable?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

/**
 * Returns appropriate icon based on property type
 */
const getPropertyIcon = (type: TExtraPropertyConfig["type"]) => {
  switch (type) {
    case "text":
    case "textarea":
    case "markdown":
      return HashPropertyIcon;
    case "select":
    case "multiselect":
      return DropdownPropertyIcon;
    case "checkbox":
      return BooleanPropertyIcon;
    default:
      return HashPropertyIcon;
  }
};

export const ExtraPropertyRenderer: FC<IExtraPropertyRenderer> = observer((props) => {
  const { configs, values, onChange, isEditable = true, workspaceSlug, projectId } = props;

  if (!configs || configs.length === 0) {
    return null;
  }

  return (
    <>
      {configs.map((config) => {
        const Icon = getPropertyIcon(config.type);
        const currentValue = values?.[config.key] ?? config.default_value ?? null;

        return (
          <SidebarPropertyListItem key={config.id} icon={Icon} label={config.label}>
            <ExtraPropertyControl
              config={config}
              value={currentValue}
              onChange={(value) => onChange(config.key, value)}
              disabled={!isEditable}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
            />
          </SidebarPropertyListItem>
        );
      })}
    </>
  );
});
