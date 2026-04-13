import type React from "react";
import { useEffect, useRef } from "react";
import { BarChart2, ChartArea, ChartLine, ChartPie, Radar, LayoutGrid } from "lucide-react";
// plane imports
import { ANALYTICS_X_AXIS_VALUES, CHART_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import type { ChartXAxisProperty } from "@plane/types";
import { CustomSelect, MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import type { TAnalyticsChartOption } from "./context";
import type { TAnalyticsChartConfig } from "./types";
import { EAnalyticsChartType } from "./types";

type Props = {
  config: TAnalyticsChartConfig;
  onUpdate: (config: TAnalyticsChartConfig) => void;
  onApply: () => void;
  xAxisOptions?: TAnalyticsChartOption[];
  projectOptions?: TAnalyticsChartOption[];
  issueTypeOptions?: TAnalyticsChartOption[];
};

const CHART_TYPES: { type: EAnalyticsChartType; label: string; icon: React.JSX.Element }[] = [
  { type: EAnalyticsChartType.BAR, label: "柱状图", icon: <BarChart2 className="size-4" /> },
  { type: EAnalyticsChartType.LINE, label: "折线图", icon: <ChartLine className="size-4" /> },
  { type: EAnalyticsChartType.AREA, label: "面积图", icon: <ChartArea className="size-4" /> },
  { type: EAnalyticsChartType.PIE, label: "饼图", icon: <ChartPie className="size-4" /> },
  { type: EAnalyticsChartType.RADAR, label: "雷达图", icon: <Radar className="size-4" /> },
  { type: EAnalyticsChartType.TREEMAP, label: "树图", icon: <LayoutGrid className="size-4" /> },
];

const DURATION_OPTIONS = [
  { value: "", label: "全部时间" },
  { value: "7d", label: "最近 7 天" },
  { value: "30d", label: "最近 30 天" },
  { value: "90d", label: "最近 3 个月" },
  { value: "180d", label: "最近 6 个月" },
  { value: "365d", label: "最近 1 年" },
];

// Stops keydown events from bubbling to TipTap's editor-level listener.
// React's synthetic onKeyDown fires AFTER TipTap (event delegation at React root),
// so we must use a native addEventListener on the element itself.
function useStopKeyPropagation() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: KeyboardEvent) => e.stopPropagation();
    el.addEventListener("keydown", stop);
    return () => el.removeEventListener("keydown", stop);
  }, []);
  return ref;
}

export function ConfigPanel({
  config,
  onUpdate,
  onApply,
  xAxisOptions: externalOptions,
  projectOptions,
  issueTypeOptions,
}: Props) {
  const titleRef = useStopKeyPropagation();

  const isDateOnlyChartType =
    config.chart_type === EAnalyticsChartType.LINE || config.chart_type === EAnalyticsChartType.AREA;
  const showGroupBy = config.chart_type !== EAnalyticsChartType.PIE;

  const allOptions = externalOptions ?? ANALYTICS_X_AXIS_VALUES;
  const xAxisOptions = isDateOnlyChartType
    ? allOptions.filter((o) => CHART_X_AXIS_DATE_PROPERTIES.includes(o.value as ChartXAxisProperty))
    : allOptions;

  function update(patch: Partial<TAnalyticsChartConfig>) {
    onUpdate({ ...config, ...patch });
  }

  function handleChartTypeChange(type: EAnalyticsChartType) {
    const patch: Partial<TAnalyticsChartConfig> = { chart_type: type };
    const isDateOnly = type === EAnalyticsChartType.LINE || type === EAnalyticsChartType.AREA;
    if (isDateOnly && !CHART_X_AXIS_DATE_PROPERTIES.includes(config.x_axis as ChartXAxisProperty)) {
      patch.x_axis = CHART_X_AXIS_DATE_PROPERTIES[0];
    }
    if (type === EAnalyticsChartType.PIE) {
      patch.group_by = undefined;
    }
    update(patch);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Chart Type Selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-secondary">图表类型</p>
        <div className="grid grid-cols-6 gap-1">
          {CHART_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleChartTypeChange(type)}
              className={cn(
                "flex flex-col items-center gap-1 rounded p-2 text-xs transition-colors",
                config.chart_type === type
                  ? "bg-custom-primary-10 text-custom-primary-100 border border-custom-primary-100"
                  : "text-secondary hover:bg-layer-3 border border-transparent"
              )}
            >
              {icon}
              <span className="leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-3">
        {/* X Axis */}
        <div>
          <p className="mb-1 text-xs font-medium text-secondary">X 轴</p>
          <CustomSelect
            value={config.x_axis ?? ""}
            label={
              <span className="text-xs">
                {xAxisOptions.find((o) => o.value === config.x_axis)?.label ?? "选择属性"}
              </span>
            }
            onChange={(val: string) => update({ x_axis: val })}
            buttonClassName="w-full text-xs"
          >
            {xAxisOptions.map((o) => (
              <CustomSelect.Option key={o.value} value={o.value}>
                {o.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        {/* Group By */}
        {showGroupBy && (
          <div>
            <p className="mb-1 text-xs font-medium text-secondary">分组</p>
            <CustomSelect
              value={config.group_by ?? ""}
              label={
                <span className="text-xs">
                  {allOptions.find((o) => o.value === config.group_by)?.label ?? "无分组"}
                </span>
              }
              onChange={(val: string) => update({ group_by: val || undefined })}
              buttonClassName="w-full text-xs"
            >
              <CustomSelect.Option value="">无分组</CustomSelect.Option>
              {allOptions
                .filter((o) => (o.value) !== config.x_axis)
                .map((o) => (
                  <CustomSelect.Option key={o.value} value={o.value}>
                    {o.label}
                  </CustomSelect.Option>
                ))}
            </CustomSelect>
          </div>
        )}

        {/* Duration */}
        <div>
          <p className="mb-1 text-xs font-medium text-secondary">时间范围</p>
          <CustomSelect
            value={config.duration ?? ""}
            label={
              <span className="text-xs">
                {DURATION_OPTIONS.find((o) => o.value === (config.duration ?? ""))?.label ?? "全部时间"}
              </span>
            }
            onChange={(val: string) => update({ duration: val || undefined })}
            buttonClassName="w-full text-xs"
          >
            {DURATION_OPTIONS.map((o) => (
              <CustomSelect.Option key={o.value} value={o.value}>
                {o.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        {/* Issue Type */}
        <div>
          <p className="mb-1 text-xs font-medium text-secondary">工作项类型</p>
          <CustomSelect
            value={config.issue_type_name ?? ""}
            label={
              <span className="text-xs">
                {(issueTypeOptions ?? []).find((o) => o.value === (config.issue_type_name ?? ""))?.label ?? "全部类型"}
              </span>
            }
            onChange={(val: string) => update({ issue_type_name: val || undefined })}
            buttonClassName="w-full text-xs"
          >
            {(issueTypeOptions ?? [{ value: "", label: "全部类型" }]).map((o) => (
              <CustomSelect.Option key={o.value} value={o.value}>
                {o.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        {/* Project IDs */}
        {projectOptions !== undefined && (
          <div className="col-span-2">
            <p className="mb-1 text-xs font-medium text-secondary">项目范围</p>
            <MultiSelectDropdown
              value={config.project_ids ?? []}
              onChange={(vals: string[]) => update({ project_ids: vals.length > 0 ? vals : undefined })}
              options={projectOptions.map((o) => ({ value: o.value, data: { label: o.label } }))}
              keyExtractor={(opt) => opt.value}
              queryArray={["label"]}
              sortByKey="label"
              buttonContent={(_isOpen: boolean, vals: unknown) => {
                const items = (vals as string[]) ?? [];
                if (items.length === 0) return <span className="text-xs text-tertiary">全部项目</span>;
                if (items.length <= 2) {
                  const labels = items.map((v) => projectOptions.find((o) => o.value === v)?.label ?? v).join(", ");
                  return <span className="text-xs truncate">{labels}</span>;
                }
                return <span className="text-xs truncate">{items.length} 个项目</span>;
              }}
              buttonContainerClassName="w-full text-left"
              buttonClassName="w-full text-xs"
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <p className="mb-1 text-xs font-medium text-secondary">图表标题</p>
        <input
          type="text"
          ref={titleRef}
          value={config.title ?? ""}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => update({ title: e.target.value || undefined })}
          placeholder="可选标题"
          className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100 placeholder:text-tertiary"
        />
      </div>

      {/* Apply Button */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onApply()}
          disabled={!config.x_axis}
          className="rounded bg-custom-primary-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          应用
        </button>
      </div>
    </div>
  );
}
