import type { FC } from "react";
import { useMemo } from "react";
import { DropdownPropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Dropdown as SingleSelectDropdown } from "@plane/ui";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface TDropdownOption {
  data: Record<string, unknown>;
  value: string;
}

interface ICompactSelectControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CompactSelectControl: FC<ICompactSelectControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const { isMobile } = usePlatformOS();

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
  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = (selectedOption?.data?.label as string) || "-";

  return (
    <Tooltip tooltipHeading={config.label} tooltipContent={displayLabel} isMobile={isMobile}>
      <div className="h-5">
        <SingleSelectDropdown
          value={selectedValue}
          onChange={onChange}
          options={options}
          disabled={disabled}
          keyExtractor={(opt) => opt.value}
          queryArray={["label", "value"]}
          sortByKey="label"
          buttonContent={() => (
            <div
              className={cn(
                "flex h-5 flex-shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-2 py-1",
                "hover:bg-layer-1 transition-colors",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <DropdownPropertyIcon className="h-3 w-3 flex-shrink-0 text-secondary" />
              <span className="text-caption-sm-regular truncate max-w-16">{displayLabel}</span>
            </div>
          )}
          buttonContainerClassName="h-5"
          buttonClassName="h-5 p-0 border-0 bg-transparent hover:bg-transparent"
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
      </div>
    </Tooltip>
  );
};
