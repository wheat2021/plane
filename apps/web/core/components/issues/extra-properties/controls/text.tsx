import type { FC } from "react";
import { useState, useRef } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

interface ITextControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextControl: FC<ITextControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const [localState, setLocalState] = useState<{ value: string; externalValue: TExtraPropertyValue }>({
    value: (value as string) || "",
    externalValue: value,
  });
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={config.description || `Enter ${config.label}...`}
      className="w-full h-7.5 px-2 text-body-xs-regular bg-transparent border border-transparent rounded hover:border-tertiary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
};
