import type { FC } from "react";
import { ToggleSwitch } from "@plane/ui";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";

interface ICheckboxControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const CheckboxControl: FC<ICheckboxControl> = (props) => {
  const { config, value, onChange, disabled } = props;

  const isChecked = value === true;
  const displayValue = isChecked ? config.true_value || "Yes" : config.false_value || "No";

  return (
    <div className="flex items-center gap-2 h-7.5">
      <ToggleSwitch value={isChecked} onChange={() => onChange(!isChecked)} disabled={disabled} size="sm" />
      <span className="text-body-xs-regular text-tertiary">{displayValue}</span>
    </div>
  );
};
