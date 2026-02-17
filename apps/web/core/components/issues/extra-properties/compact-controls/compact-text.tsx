import type { FC } from "react";
import { useState, useRef } from "react";
import { HashPropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface ICompactTextControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CompactTextControl: FC<ICompactTextControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const { isMobile } = usePlatformOS();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState((value as string) || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = (value as string) || "";

  const handleClick = () => {
    if (disabled) return;
    setLocalValue(displayValue);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== displayValue) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(displayValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-5 w-24 px-1 text-caption-sm-regular bg-layer-1 border border-primary rounded-sm focus:outline-none"
      />
    );
  }

  return (
    <Tooltip tooltipHeading={config.label} tooltipContent={displayValue || "Empty"} isMobile={isMobile}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex h-5 flex-shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-[0.5px] border-strong px-2 py-1",
          "hover:bg-layer-1 transition-colors",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <HashPropertyIcon className="h-3 w-3 flex-shrink-0 text-secondary" />
        <span className="text-caption-sm-regular truncate max-w-16">{displayValue || "-"}</span>
      </button>
    </Tooltip>
  );
};
