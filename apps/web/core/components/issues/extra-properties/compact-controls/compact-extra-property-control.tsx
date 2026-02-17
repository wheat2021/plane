import type { FC } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { CompactTextControl } from "./compact-text";
import { CompactSelectControl } from "./compact-select";
import { CompactCheckboxControl } from "./compact-checkbox";

interface ICompactExtraPropertyControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: TExtraPropertyValue) => void;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const CompactExtraPropertyControl: FC<ICompactExtraPropertyControl> = (props) => {
  const { config, value, onChange, disabled } = props;

  switch (config.type) {
    case "text":
    case "textarea":
    case "markdown":
      return (
        <CompactTextControl
          config={config}
          value={value}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    case "select":
      return (
        <CompactSelectControl
          config={config}
          value={value}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    case "multiselect":
      return (
        <CompactSelectControl
          config={config}
          value={Array.isArray(value) ? value[0] : value}
          onChange={(val) => onChange([val])}
          disabled={disabled}
        />
      );
    case "checkbox":
      return (
        <CompactCheckboxControl
          config={config}
          value={value}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
};
