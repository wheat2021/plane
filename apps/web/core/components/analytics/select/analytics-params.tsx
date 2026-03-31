import { useMemo } from "react";
import { observer } from "mobx-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SlidersHorizontal } from "lucide-react";
// plane package imports
import { CalendarLayoutIcon } from "@plane/propel/icons";
import type { IAnalyticsParams, TAnalyticsXAxisProperty } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// analytics hooks
import {
  useAnalyticsIssueTypeOptions,
  useAnalyticsXAxisOptions,
} from "@/components/analytics/hooks/use-analytics-options";
// plane web components
import { SelectXAxis } from "./select-x-axis";

type Props = {
  control: Control<IAnalyticsParams, unknown>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  params: IAnalyticsParams;
  workspaceSlug: string;
  projectId?: string;
  classNames?: string;
};

export const AnalyticsSelectParams = observer(function AnalyticsSelectParams(props: Props) {
  const { control, params, classNames, workspaceSlug, projectId } = props;

  const axisOptions = useAnalyticsXAxisOptions(workspaceSlug, projectId);
  const issueTypeOptions = useAnalyticsIssueTypeOptions(workspaceSlug, projectId);

  const xAxisOptions = useMemo(
    () => axisOptions.filter((option) => option.value !== params.group_by),
    [axisOptions, params.group_by]
  );
  const groupByOptions = useMemo(
    () => axisOptions.filter((option) => option.value !== params.x_axis),
    [axisOptions, params.x_axis]
  );

  const issueTypeLabel = useMemo(() => {
    const id = params.issue_type_id;
    const name = params.issue_type_name;
    if (!id && !name) return "全部类型";
    const found = issueTypeOptions.find((o) => (id && o.value === id) || (name && o.issueTypeName === name));
    return found?.label ?? "全部类型";
  }, [params.issue_type_id, params.issue_type_name, issueTypeOptions]);

  return (
    <div className={cn("flex w-full justify-between", classNames)}>
      <div className="flex items-center gap-2">
        {/* Issue Type Selector (replaces Y-axis) */}
        <Controller
          name="issue_type_id"
          control={control}
          render={({ field: { onChange: onChangeId } }) => (
            <Controller
              name="issue_type_name"
              control={control}
              render={({ field: { onChange: onChangeName } }) => (
                <CustomSelect
                  value={params.issue_type_id ?? params.issue_type_name ?? null}
                  label={
                    <span
                      className={cn(
                        "text-secondary",
                        (params.issue_type_id || params.issue_type_name) && "text-primary"
                      )}
                    >
                      {issueTypeLabel}
                    </span>
                  }
                  onChange={(val: string | null) => {
                    const selected = issueTypeOptions.find((o) => o.value === val || o.issueTypeName === val);
                    if (!selected || (!selected.value && !selected.issueTypeName)) {
                      onChangeId(undefined);
                      onChangeName(undefined);
                    } else if (selected.value) {
                      // Project context: filter by id
                      onChangeId(selected.value);
                      onChangeName(undefined);
                    } else {
                      // Workspace context: filter by name
                      onChangeId(undefined);
                      onChangeName(selected.issueTypeName);
                    }
                  }}
                  maxHeight="lg"
                >
                  {issueTypeOptions.map((option) => (
                    <CustomSelect.Option
                      key={option.issueTypeName ?? option.value ?? "all"}
                      value={option.value ?? option.issueTypeName ?? null}
                    >
                      {option.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          )}
        />

        {/* X-axis */}
        <Controller
          name="x_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value}
              onChange={(val: TAnalyticsXAxisProperty | null) => {
                if (val) onChange(val);
              }}
              label={
                <div className="flex items-center gap-2">
                  <CalendarLayoutIcon className="h-3 w-3" />
                  <span className={cn("text-secondary", value && "text-primary")}>
                    {axisOptions.find((v) => v.value === value)?.label || "Add Property"}
                  </span>
                </div>
              }
              options={xAxisOptions}
            />
          )}
        />

        {/* Group By */}
        <Controller
          name="group_by"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value ?? undefined}
              onChange={(val: TAnalyticsXAxisProperty | null) => {
                onChange(val ?? undefined);
              }}
              label={
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span className={cn("text-secondary", value && "text-primary")}>
                    {axisOptions.find((v) => v.value === value)?.label || "Add Property"}
                  </span>
                </div>
              }
              options={groupByOptions}
              placeholder="Group By"
              allowNoValue
            />
          )}
        />
      </div>
    </div>
  );
});
