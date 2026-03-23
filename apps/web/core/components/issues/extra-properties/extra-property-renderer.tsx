import type { FC } from "react";
import { observer } from "mobx-react";
// icons
import { BooleanPropertyIcon, DropdownPropertyIcon } from "@plane/propel/icons";
import { Type, AlignLeft, User, Link2 } from "lucide-react";
// types
import type { TExtraPropertyConfig, TExtraPropertyValue, TIssueExtraProperties } from "@plane/types";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { ExtraPropertyDescriptionPopover } from "./description-popover";
import { ExtraPropertyControl } from "./extra-property-control";

interface IExtraPropertyRenderer {
  configs: TExtraPropertyConfig[];
  values: TIssueExtraProperties | undefined;
  onChange: (key: string, value: TExtraPropertyValue) => void;
  isEditable?: boolean;
  workspaceSlug?: string;
  projectId?: string;
  requiredKeys?: Set<string>;
}

/**
 * Returns appropriate icon based on property type
 */
const getPropertyIcon = (type: TExtraPropertyConfig["type"]) => {
  switch (type) {
    case "text":
      return Type;
    case "textarea":
      return AlignLeft;
    case "select":
    case "multiselect":
      return DropdownPropertyIcon;
    case "checkbox":
      return BooleanPropertyIcon;
    case "member":
      return User;
    case "reference":
      return Link2;
    default:
      return Type;
  }
};

export const ExtraPropertyRenderer: FC<IExtraPropertyRenderer> = observer((props) => {
  const { configs, values, onChange, isEditable = true, workspaceSlug, projectId, requiredKeys } = props;

  if (!configs || configs.length === 0) {
    return null;
  }

  return (
    <>
      {configs.map((config) => {
        const Icon = getPropertyIcon(config.type);
        const currentValue = values?.[config.key] ?? null;
        const isRequired = requiredKeys?.has(config.key) ?? false;

        return (
          <SidebarPropertyListItem
            key={config.id}
            icon={Icon}
            label={`${config.label}${isRequired ? " *" : ""}`}
            appendElement={
              config.description ? <ExtraPropertyDescriptionPopover description={config.description} /> : undefined
            }
          >
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
