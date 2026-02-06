import type { FC } from "react";
import { useMemo } from "react";
import { Dropdown as SingleSelectDropdown } from "@plane/ui";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

// Local type definition matching @plane/ui's TDropdownOption
interface TDropdownOption {
  data: Record<string, unknown>;
  value: string;
  className?: ({ active, selected }: { active: boolean; selected?: boolean }) => string;
  disabled?: boolean;
}

interface ISelectControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SelectControl: FC<ISelectControl> = (props) => {
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

  const selectedValue = (value as string) || "";

  return (
    <SingleSelectDropdown
      value={selectedValue}
      onChange={onChange}
      options={options}
      disabled={disabled}
      keyExtractor={(opt) => opt.value}
      queryArray={["label", "value"]}
      sortByKey="label"
      buttonContent={(_isOpen, val) => {
        const option = options.find((opt) => opt.value === val);
        const label = (option?.data?.label as string) || "Select...";
        return <span className={`text-body-xs-regular ${option ? "" : "text-placeholder"}`}>{label}</span>;
      }}
      buttonContainerClassName="w-full text-left h-7.5"
      buttonClassName="w-full"
      renderItem={({ value: itemValue, selected }) => {
        const option = options.find((opt) => opt.value === itemValue);
        const label = (option?.data?.label as string) || itemValue;
        return (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className={`text-body-xs-regular ${selected ? "font-medium" : ""}`}>{label}</span>
          </div>
        );
      }}
    />
  );
};
