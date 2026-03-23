import { useEffect, useRef } from "react";
import type { FC } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue, TReferenceItem } from "@plane/types";
// controls
import { TextControl } from "./controls/text";
import { TextareaControl } from "./controls/textarea";
import { SelectControl } from "./controls/select";
import { MultiSelectControl } from "./controls/multi-select";
import { CheckboxControl } from "./controls/checkbox";
import { MemberControl } from "./controls/member";
import { ReferenceControl } from "./controls/reference";

/** Type guard: value is a string[] (not TReferenceItem[]) */
const isStringArray = (v: TExtraPropertyValue): v is string[] =>
  Array.isArray(v) && (v.length === 0 || typeof v[0] === "string");

/** Type guard: value is a TReferenceItem[] */
const isReferenceArray = (v: TExtraPropertyValue): v is TReferenceItem[] =>
  Array.isArray(v) && (v.length === 0 || (typeof v[0] === "object" && v[0] !== null));

/**
 * Checks if a value is valid for the given config type.
 */
const isValueValid = (config: TExtraPropertyConfig, value: TExtraPropertyValue): boolean => {
  if (value === null || value === undefined) return true;
  switch (config.type) {
    case "text":
    case "textarea":
      return typeof value === "string";
    case "checkbox":
      return typeof value === "boolean";
    case "select": {
      if (typeof value !== "string") return false;
      const validValues = new Set(config.options?.map((o) => o.value) ?? []);
      return validValues.has(value);
    }
    case "multiselect": {
      if (!isStringArray(value)) return false;
      if (value.length === 0) return true;
      const validValues = new Set(config.options?.map((o) => o.value) ?? []);
      return value.every((v) => validValues.has(v));
    }
    case "member":
      return typeof value === "string";
    case "reference":
      return isReferenceArray(value);
    default:
      return true;
  }
};

/**
 * For multiselect, filters out invalid elements. Returns null if all invalid.
 */
const sanitizeValue = (config: TExtraPropertyConfig, value: TExtraPropertyValue): TExtraPropertyValue => {
  if (config.type !== "multiselect" || !isStringArray(value)) return null;
  const validValues = new Set(config.options?.map((o) => o.value) ?? []);
  const filtered = value.filter((v) => validValues.has(v));
  return filtered.length > 0 ? filtered : null;
};

interface IExtraPropertyControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: TExtraPropertyValue) => void;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const ExtraPropertyControl: FC<IExtraPropertyControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const hasValidated = useRef(false);

  // Validate value on mount only, only when editable
  useEffect(() => {
    if (disabled || hasValidated.current) return;
    hasValidated.current = true;
    if (value === null || value === undefined) return;
    if (!isValueValid(config, value)) {
      if (config.type === "multiselect" && Array.isArray(value)) {
        onChange(sanitizeValue(config, value));
      } else {
        onChange(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    case "member":
      return (
        <MemberControl
          config={config}
          value={value}
          onChange={(val) => onChange(val)}
          disabled={disabled}
          workspaceSlug={props.workspaceSlug}
        />
      );
    case "reference":
      return <ReferenceControl config={config} value={value} onChange={(val) => onChange(val)} disabled={disabled} />;
    default:
      return null;
  }
};
