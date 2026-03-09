import type { FC } from "react";
import { Square, SquareCheck } from "lucide-react";
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
          "flex h-5 w-5 flex-shrink-0 items-center justify-center transition-colors",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {isChecked ? (
          <SquareCheck className="h-4 w-4 flex-shrink-0 text-accent-primary" />
        ) : (
          <Square className="h-4 w-4 flex-shrink-0 text-tertiary" />
        )}
      </button>
    </Tooltip>
  );
};
