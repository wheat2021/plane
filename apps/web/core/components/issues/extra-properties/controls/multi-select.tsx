import type { FC } from "react";
import { useMemo } from "react";
import { MultiSelectDropdown } from "@plane/ui";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

// Local type definition matching @plane/ui's TDropdownOption
interface TDropdownOption {
  data: Record<string, unknown>;
  value: string;
  className?: ({ active, selected }: { active: boolean; selected?: boolean }) => string;
  disabled?: boolean;
}

interface IMultiSelectControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export const MultiSelectControl: FC<IMultiSelectControl> = (props) => {
  const { config, value, onChange, disabled } = props;

  const options: TDropdownOption[] = useMemo(
    () =>
      (config.options || []).map((opt) => ({
        value: opt.value,
        data: { value: opt.value, label: opt.label || opt.value },
      })),
    [config.options]
  );

  const selectedValues: string[] = useMemo(
    () => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []),
    [value]
  );

  return (
    <MultiSelectDropdown
      value={selectedValues}
      onChange={onChange}
      options={options}
      disabled={disabled}
      keyExtractor={(opt) => opt.value}
      queryArray={["label", "value"]}
      sortByKey="label"
      buttonContent={(_isOpen, vals) => {
        const items = (vals as string[]) ?? [];
        if (items.length === 0) {
          return <span className="text-body-xs-regular text-placeholder">Select...</span>;
        }
        if (items.length <= 2) {
          const labels = items
            .map((v) => {
              const opt = options.find((o) => o.value === v);
              const annotation = opt?.data?.label as string | undefined;
              if (annotation && annotation !== v) return `${v} · ${annotation}`;
              return v;
            })
            .join(", ");
          return <span className="text-body-xs-regular truncate">{labels}</span>;
        }
        return <span className="text-body-xs-regular truncate">{items.length} selected</span>;
      }}
      buttonContainerClassName="w-full text-left h-7.5"
      buttonClassName="w-full"
    />
  );
};
