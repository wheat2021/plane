// plane package imports
import type { TAnalyticsXAxisProperty } from "@plane/types";
import { CustomSelect } from "@plane/ui";

type Props = {
  value?: TAnalyticsXAxisProperty;
  onChange: (val: TAnalyticsXAxisProperty | null) => void;
  options: { value: TAnalyticsXAxisProperty; label: string }[];
  placeholder?: string;
  hiddenOptions?: TAnalyticsXAxisProperty[];
  allowNoValue?: boolean;
  label?: string | React.ReactNode;
};

export function SelectXAxis(props: Props) {
  const { value, onChange, options, hiddenOptions, allowNoValue, label } = props;
  return (
    <CustomSelect value={value} label={label} onChange={onChange} maxHeight="lg">
      {allowNoValue && <CustomSelect.Option value={null}>No value</CustomSelect.Option>}
      {options.map((item) => {
        if (hiddenOptions?.includes(item.value)) return null;
        return (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        );
      })}
    </CustomSelect>
  );
}
