import type { FC } from "react";
import { BooleanPropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface ICompactCheckboxControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const CompactCheckboxControl: FC<ICompactCheckboxControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const { isMobile } = usePlatformOS();

  const isChecked = value === true;
  const displayValue = isChecked ? config.true_value || "Yes" : config.false_value || "No";

  const handleClick = () => {
    if (disabled) return;
    onChange(!isChecked);
  };

  return (
    <Tooltip tooltipHeading={config.label} tooltipContent={displayValue} isMobile={isMobile}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex h-5 flex-shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-2 py-1",
          "hover:bg-layer-1 transition-colors",
          isChecked && "bg-accent-50 border-accent-strong",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <BooleanPropertyIcon className={cn("h-3 w-3 flex-shrink-0", isChecked ? "text-accent-primary" : "text-secondary")} />
        <span className={cn("text-caption-sm-regular", isChecked && "text-accent-primary")}>{displayValue}</span>
      </button>
    </Tooltip>
  );
};
