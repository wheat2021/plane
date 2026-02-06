import type { FC } from "react";
import { useState, useCallback } from "react";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

interface IMarkdownControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const MarkdownControl: FC<IMarkdownControl> = (props) => {
  const { config, value, onChange, disabled } = props;
  const [localState, setLocalState] = useState<{ value: string; externalValue: TExtraPropertyValue }>({
    value: (value as string) || "",
    externalValue: value,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive local value, resetting when external value changes
  let localValue = localState.value;
  if (localState.externalValue !== value) {
    localValue = (value as string) || "";
    setLocalState({ value: localValue, externalValue: value });
  }

  const setLocalValue = (newValue: string) => {
    setLocalState((prev) => ({ ...prev, value: newValue }));
  };

  const handleBlur = useCallback(() => {
    setIsExpanded(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  // For now, using a simple textarea as markdown editor
  // This can be replaced with LiteTextEditor when the integration is needed
  return (
    <div className="w-full">
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder={config.description || `Enter ${config.label} (Markdown supported)...`}
        rows={isExpanded ? 5 : 2}
        className="w-full px-2 py-1.5 text-body-xs-regular bg-transparent border border-transparent rounded hover:border-tertiary focus:border-primary focus:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-60 transition-all font-mono"
      />
      {isExpanded && <div className="text-[10px] text-tertiary mt-1">Markdown formatting supported</div>}
    </div>
  );
};
