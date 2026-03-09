import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Info } from "lucide-react";
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
 * Clickable info icon that shows the property description in a popover
 */
const DescriptionPopover: FC<{ description: string }> = ({ description }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center text-tertiary hover:text-secondary transition-colors"
      >
        <Info className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-50 w-64 rounded-md border border-subtle bg-layer-2 p-2.5 shadow-lg text-xs text-secondary leading-relaxed select-text">
          {description}
        </div>
      )}
    </div>
  );
};

/**
 * Returns appropriate icon based on property type
 */
const getPropertyIcon = (type: TExtraPropertyConfig["type"]) => {
  switch (type) {
    case "text":
    case "textarea":
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
        const currentValue = values?.[config.key] ?? null;

        return (
          <SidebarPropertyListItem
            key={config.id}
            icon={Icon}
            label={config.label}
            appendElement={config.description ? <DescriptionPopover description={config.description} /> : undefined}
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
