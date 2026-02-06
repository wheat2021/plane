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

  const options: TDropdownOption[] = useMemo(() => {
    return (config.options || []).map((opt) => ({
      value: opt.value,
      data: {
        value: opt.value,
        label: opt.label || opt.value,
      },
    }));
  }, [config.options]);

  const selectedValues = Array.isArray(value) ? value : [];

  const selectedLabels = selectedValues
    .map((v) => {
      const opt = options.find((o) => o.value === v);
      return (opt?.data?.label as string) || v;
    })
    .join(", ");

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
        const selectedCount = (vals as string[])?.length || 0;
        if (selectedCount === 0) {
          return <span className="text-body-xs-regular text-placeholder">Select...</span>;
        }
        return (
          <span className="text-body-xs-regular truncate">
            {selectedCount <= 2 ? selectedLabels : `${selectedCount} selected`}
          </span>
        );
      }}
      buttonContainerClassName="w-full text-left h-7.5"
      buttonClassName="w-full"
      renderItem={({ value: itemValue, selected }) => {
        const option = options.find((opt) => opt.value === itemValue);
        const label = (option?.data?.label as string) || itemValue;
        return (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div
              className={`size-4 rounded border flex items-center justify-center ${
                selected ? "bg-primary border-primary" : "border-tertiary"
              }`}
            >
              {selected && (
                <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-body-xs-regular">{label}</span>
          </div>
        );
      }}
    />
  );
};
