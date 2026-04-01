import type React from "react";
import { useState } from "react";
import { BarChart2, ChartArea, ChartLine, ChartPie, Radar, LayoutGrid } from "lucide-react";
// plane imports
import { ANALYTICS_X_AXIS_VALUES, CHART_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import type { ChartXAxisProperty } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import type { TAnalyticsChartConfig } from "./types";
import { EAnalyticsChartType } from "./types";

type Props = {
  config: TAnalyticsChartConfig;
  onApply: (config: TAnalyticsChartConfig) => void;
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
  { value: "7d", label: "最近 7 天" },
  { value: "30d", label: "最近 30 天" },
  { value: "90d", label: "最近 3 个月" },
  { value: "180d", label: "最近 6 个月" },
  { value: "365d", label: "最近 1 年" },
];

// Date axis properties for Line/Area chart constraints
const DATE_AXIS_VALUES = ANALYTICS_X_AXIS_VALUES.filter((o) => CHART_X_AXIS_DATE_PROPERTIES.includes(o.value));

export function ConfigPanel({ config: initialConfig, onApply }: Props) {
  const [config, setConfig] = useState<TAnalyticsChartConfig>(initialConfig);

  const isDateOnlyChartType =
    config.chart_type === EAnalyticsChartType.LINE || config.chart_type === EAnalyticsChartType.AREA;
  const showGroupBy = config.chart_type !== EAnalyticsChartType.PIE;

  const xAxisOptions = isDateOnlyChartType ? DATE_AXIS_VALUES : ANALYTICS_X_AXIS_VALUES;

  function handleChartTypeChange(type: EAnalyticsChartType) {
    const newConfig = { ...config, chart_type: type };
    const isDateOnly = type === EAnalyticsChartType.LINE || type === EAnalyticsChartType.AREA;
    // If switching to date-only and current x_axis is not date, clear it
    if (isDateOnly && !CHART_X_AXIS_DATE_PROPERTIES.includes(config.x_axis as ChartXAxisProperty)) {
      newConfig.x_axis = CHART_X_AXIS_DATE_PROPERTIES[0];
    }
    // Pie: clear group_by
    if (type === EAnalyticsChartType.PIE) {
      delete newConfig.group_by;
    }
    setConfig(newConfig);
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
          <select
            value={config.x_axis ?? ""}
            onChange={(e) => setConfig({ ...config, x_axis: e.target.value })}
            className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100"
          >
            <option value="">选择属性</option>
            {xAxisOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group By */}
        {showGroupBy && (
          <div>
            <p className="mb-1 text-xs font-medium text-secondary">分组</p>
            <select
              value={config.group_by ?? ""}
              onChange={(e) => setConfig({ ...config, group_by: e.target.value || undefined })}
              className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100"
            >
              <option value="">无分组</option>
              {ANALYTICS_X_AXIS_VALUES.filter((o) => (o.value as string) !== config.x_axis).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duration */}
        <div>
          <p className="mb-1 text-xs font-medium text-secondary">时间范围</p>
          <select
            value={config.duration ?? ""}
            onChange={(e) => setConfig({ ...config, duration: e.target.value || undefined })}
            className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100"
          >
            <option value="">全部时间</option>
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Type Name */}
        <div>
          <p className="mb-1 text-xs font-medium text-secondary">工作项类型</p>
          <input
            type="text"
            value={config.issue_type_name ?? ""}
            onChange={(e) => setConfig({ ...config, issue_type_name: e.target.value || undefined })}
            placeholder="全部类型"
            className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100 placeholder:text-tertiary"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="mb-1 text-xs font-medium text-secondary">图表标题</p>
        <input
          type="text"
          value={config.title ?? ""}
          onChange={(e) => setConfig({ ...config, title: e.target.value || undefined })}
          placeholder="可选标题"
          className="w-full rounded border border-subtle bg-layer-2 px-2 py-1.5 text-xs text-primary outline-none focus:border-custom-primary-100 placeholder:text-tertiary"
        />
      </div>

      {/* Apply Button */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onApply(config)}
          disabled={!config.x_axis}
          className="rounded bg-custom-primary-100 px-4 py-1.5 text-xs font-medium text-white hover:bg-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          应用
        </button>
      </div>
    </div>
  );
}
