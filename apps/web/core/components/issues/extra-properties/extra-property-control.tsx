import type { FC } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
// controls
import { TextControl } from "./controls/text";
import { TextareaControl } from "./controls/textarea";
import { SelectControl } from "./controls/select";
import { MultiSelectControl } from "./controls/multi-select";
import { CheckboxControl } from "./controls/checkbox";
import { MarkdownControl } from "./controls/markdown";

interface IExtraPropertyControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: TExtraPropertyValue) => void;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const ExtraPropertyControl: FC<IExtraPropertyControl> = (props) => {
  const { config, value, onChange, disabled, workspaceSlug, projectId } = props;

  switch (config.type) {
    case "text":
      return <TextControl config={config} value={value} onChange={onChange} disabled={disabled} />;
    case "textarea":
      return <TextareaControl config={config} value={value} onChange={onChange} disabled={disabled} />;
    case "select":
      return <SelectControl config={config} value={value} onChange={onChange} disabled={disabled} />;
    case "multiselect":
      return (
        <MultiSelectControl config={config} value={value} onChange={(vals) => onChange(vals)} disabled={disabled} />
      );
    case "checkbox":
      return <CheckboxControl config={config} value={value} onChange={onChange} disabled={disabled} />;
    case "markdown":
      return (
        <MarkdownControl
          config={config}
          value={value}
          onChange={onChange}
          disabled={disabled}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      );
    default:
      return null;
  }
};
