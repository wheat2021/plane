import type { FC } from "react";
import { icons, Square, SquareCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getLucideIcon(name: string): LucideIcon | null {
  if (!name) return null;
  const key = toPascalCase(name);
  return (icons as Record<string, LucideIcon>)[key] ?? null;
}

export const CompactCheckboxControl: FC<ICompactCheckboxControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const { isMobile } = usePlatformOS();

  const isChecked = value === true;
  const displayValue = isChecked ? config.true_value || "Yes" : config.false_value || "No";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    onChange(!isChecked);
  };

  const renderIcon = () => {
    if (isChecked) {
      const CustomIcon = config.true_icon ? getLucideIcon(config.true_icon) : null;
      if (CustomIcon) {
        return (
          <CustomIcon className="h-4 w-4 flex-shrink-0" color={config.true_icon_color ?? "#6b7280"} strokeWidth={2} />
        );
      }
      return <SquareCheck className="h-4 w-4 flex-shrink-0 text-accent-primary" />;
    } else {
      const CustomIcon = config.false_icon ? getLucideIcon(config.false_icon) : null;
      if (CustomIcon) {
        return (
          <CustomIcon className="h-4 w-4 flex-shrink-0" color={config.false_icon_color ?? "#6b7280"} strokeWidth={2} />
        );
      }
      return <Square className="h-4 w-4 flex-shrink-0 text-tertiary" />;
    }
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
        {renderIcon()}
      </button>
    </Tooltip>
  );
};
