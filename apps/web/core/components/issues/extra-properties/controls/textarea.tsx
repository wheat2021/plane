import type { FC } from "react";
import { useState, useRef } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

interface ITextareaControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextareaControl: FC<ITextareaControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const [localState, setLocalState] = useState<{ value: string; externalValue: TExtraPropertyValue }>({
    value: (value as string) || "",
    externalValue: value,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive local value, resetting when external value changes
  let localValue = localState.value;
  if (localState.externalValue !== value) {
    localValue = (value as string) || "";
    setLocalState({ value: localValue, externalValue: value });
  }

  const setLocalValue = (newValue: string) => {
    setLocalState((prev) => ({ ...prev, value: newValue }));
  };

  const handleBlur = () => {
    setIsExpanded(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder={config.description || `Enter ${config.label}...`}
        rows={isExpanded ? 3 : 1}
        className="w-full px-2 py-1.5 text-body-xs-regular bg-transparent border border-transparent rounded hover:border-tertiary focus:border-primary focus:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      />
    </div>
  );
};
