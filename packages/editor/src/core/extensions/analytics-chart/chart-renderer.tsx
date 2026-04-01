import { AlertCircle, BarChart2, RefreshCw, Settings } from "lucide-react";
import useSWR from "swr";
// plane imports
import { API_BASE_URL, CHART_COLOR_PALETTES, CHART_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { RadarChart } from "@plane/propel/charts/radar-chart";
import { TreeMapChart } from "@plane/propel/charts/tree-map";
import type {
  TChart,
  TChartDatum,
  TBarItem,
  TLineItem,
  TAreaItem,
  TCellItem,
  TRadarItem,
  TreeMapItem,
  ChartXAxisProperty,
} from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import type { TAnalyticsChartConfig } from "./types";
import { EAnalyticsChartType } from "./types";

type Props = {
  config: TAnalyticsChartConfig;
  workspaceSlug: string;
  onConfigClick?: () => void;
};

// Build SWR cache key and API URL
function buildFetchParams(workspaceSlug: string, config: TAnalyticsChartConfig): [string, string] | null {
  if (!workspaceSlug || !config.x_axis) return null;
  const params = new URLSearchParams();
  params.set("type", "custom-work-items");
  if (config.x_axis) params.set("x_axis", config.x_axis);
  if (config.group_by) params.set("group_by", config.group_by);
  if (config.issue_type_id) params.set("issue_type_id", config.issue_type_id);
  if (config.issue_type_name) params.set("issue_type_name", config.issue_type_name);
  if (config.project_ids?.length) params.set("project_ids", config.project_ids.join(","));
  if (config.duration) params.set("duration", config.duration);
  const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/advance-analytics-charts?${params.toString()}`;
  const key = `analytics-chart-${workspaceSlug}-${params.toString()}`;
  return [key, url];
}

async function fetchChart(url: string): Promise<{ data: TChartDatum[]; schema: Record<string, string> }> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = new Error(
      res.status === 403 ? "无权访问此数据，请检查项目权限" : "数据加载失败，请稍后重试"
    ) as Error & { is403?: boolean };
    err.is403 = res.status === 403;
    throw err;
  }
  const raw = (await res.json()) as TChart;
  return parseChartData(raw);
}

// Parse raw API data into chart-friendly format
function parseChartData(data: TChart): { data: TChartDatum[]; schema: Record<string, string> } {
  if (!data?.data?.length) return { data: [], schema: {} };
  const schema = data.schema ?? {};
  const allKeys = Object.keys(schema);
  const parsed = data.data.map((datum) => {
    const missing: Record<string, number> = Object.fromEntries(allKeys.filter((k) => !(k in datum)).map((k) => [k, 0]));
    return { ...datum, ...missing };
  });
  return { data: parsed, schema };
}

const COLORS = CHART_COLOR_PALETTES[0]?.light ?? ["#6172E8", "#8B6EDB", "#E05F99", "#29A383", "#CB8A37"];

export function ChartRenderer({ config, workspaceSlug, onConfigClick }: Props) {
  const fetchParams = buildFetchParams(workspaceSlug, config);
  const swrKey = fetchParams ? fetchParams[0] : null;
  const swrUrl = fetchParams ? fetchParams[1] : null;

  const {
    data: chartData,
    isLoading,
    error,
    mutate,
  } = useSWR<{ data: TChartDatum[]; schema: Record<string, string> }, Error & { is403?: boolean }>(
    swrKey,
    swrUrl ? () => fetchChart(swrUrl) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <Loader className="h-[300px] w-full">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );
  }

  if (error) {
    const is403 = !!error.is403;
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm">
        <AlertCircle className="size-8 text-red-500" />
        <p className="text-secondary">{error.message ?? "数据加载失败，请稍后重试"}</p>
        <div className="flex gap-2">
          {is403 && onConfigClick && (
            <button
              type="button"
              onClick={onConfigClick}
              className="flex items-center gap-1 rounded border border-subtle px-3 py-1.5 text-xs text-secondary hover:bg-layer-3"
            >
              <Settings className="size-3" />
              配置
            </button>
          )}
          {!is403 && (
            <button
              type="button"
              onClick={() => void mutate()}
              className="flex items-center gap-1 rounded border border-subtle px-3 py-1.5 text-xs text-secondary hover:bg-layer-3"
            >
              <RefreshCw className="size-3" />
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm">
        <BarChart2 className="size-8 text-tertiary" />
        <p className="text-secondary">暂无数据，请调整过滤条件</p>
      </div>
    );
  }

  return <ChartContent config={config} chartData={chartData} />;
}

function ChartContent({
  config,
  chartData,
}: {
  config: TAnalyticsChartConfig;
  chartData: { data: TChartDatum[]; schema: Record<string, string> };
}) {
  const schemaKeys = Object.keys(chartData.schema);
  const isDateAxis = CHART_X_AXIS_DATE_PROPERTIES.includes(config.x_axis as ChartXAxisProperty);
  const isStacked = schemaKeys.length > 0 && !!config.group_by;
  const xAxisLabel = config.x_axis ?? "";
  const commonClassName = "h-[300px] w-full";

  if (config.chart_type === EAnalyticsChartType.BAR) {
    const bars: TBarItem<string>[] = isStacked
      ? schemaKeys.map((key, i) => ({
          key,
          label: chartData.schema[key] ?? key,
          stackId: "bar",
          fill: COLORS[i % COLORS.length] ?? "#6172E8",
          textClassName: "",
          showPercentage: false,
          showTopBorderRadius: (_v: string, payload: TChartDatum) =>
            schemaKeys[schemaKeys.findLastIndex((k) => (payload as Record<string, number>)[k] > 0)] === key,
          showBottomBorderRadius: (_v: string, payload: TChartDatum) =>
            schemaKeys[schemaKeys.findIndex((k) => (payload as Record<string, number>)[k] > 0)] === key,
        }))
      : [
          {
            key: "count",
            label: "Count",
            stackId: "bar",
            fill: COLORS[0] ?? "#6172E8",
            textClassName: "",
            showPercentage: false,
            showTopBorderRadius: () => true,
            showBottomBorderRadius: () => true,
          },
        ];

    return (
      <BarChart
        className={commonClassName}
        data={chartData.data}
        bars={bars}
        margin={{ bottom: 30 }}
        xAxis={{ key: "name", label: xAxisLabel, dy: 30 }}
        yAxis={{ key: "count", label: "工作项数", offset: -60, dx: -26 }}
      />
    );
  }

  if (config.chart_type === EAnalyticsChartType.LINE) {
    const lines: TLineItem<string>[] = isStacked
      ? schemaKeys.map((key, i) => ({
          key,
          label: chartData.schema[key] ?? key,
          dashedLine: false,
          fill: COLORS[i % COLORS.length] ?? "#6172E8",
          showDot: true,
          smoothCurves: isDateAxis,
          stroke: COLORS[i % COLORS.length] ?? "#6172E8",
        }))
      : [
          {
            key: "count",
            label: "Count",
            dashedLine: false,
            fill: COLORS[0] ?? "#6172E8",
            showDot: true,
            smoothCurves: isDateAxis,
            stroke: COLORS[0] ?? "#6172E8",
          },
        ];

    return (
      <LineChart
        className={commonClassName}
        data={chartData.data}
        lines={lines}
        margin={{ bottom: 30 }}
        xAxis={{ key: "name", label: xAxisLabel, dy: 30 }}
        yAxis={{ key: "count", label: "工作项数", offset: -60, dx: -26 }}
      />
    );
  }

  if (config.chart_type === EAnalyticsChartType.AREA) {
    const areas: TAreaItem<string>[] = isStacked
      ? schemaKeys.map((key, i) => ({
          key,
          label: chartData.schema[key] ?? key,
          stackId: "area",
          fill: COLORS[i % COLORS.length] ?? "#6172E8",
          fillOpacity: 0.3,
          showDot: false,
          smoothCurves: isDateAxis,
          strokeColor: COLORS[i % COLORS.length] ?? "#6172E8",
          strokeOpacity: 1,
        }))
      : [
          {
            key: "count",
            label: "Count",
            stackId: "area",
            fill: COLORS[0] ?? "#6172E8",
            fillOpacity: 0.3,
            showDot: false,
            smoothCurves: isDateAxis,
            strokeColor: COLORS[0] ?? "#6172E8",
            strokeOpacity: 1,
          },
        ];

    return (
      <AreaChart
        className={commonClassName}
        data={chartData.data}
        areas={areas}
        margin={{ bottom: 30 }}
        xAxis={{ key: "name", label: xAxisLabel, dy: 30 }}
        yAxis={{ key: "count", label: "工作项数", offset: -60, dx: -26 }}
      />
    );
  }

  if (config.chart_type === EAnalyticsChartType.PIE) {
    const cells: TCellItem<string>[] = chartData.data.map((datum, i) => ({
      key: datum.key,
      fill: COLORS[i % COLORS.length] ?? "#6172E8",
    }));

    return (
      <PieChart
        className={commonClassName}
        data={chartData.data}
        dataKey="count"
        cells={cells}
        showLabel={false}
        showTooltip
      />
    );
  }

  if (config.chart_type === EAnalyticsChartType.RADAR) {
    const radars: TRadarItem<string>[] = [
      {
        key: "count",
        name: "Count",
        fill: COLORS[0] ?? "#6172E8",
        stroke: COLORS[0] ?? "#6172E8",
        fillOpacity: 0.3,
      },
    ];

    return (
      <RadarChart
        className={cn(commonClassName, "overflow-visible")}
        data={chartData.data}
        dataKey="count"
        radars={radars}
        angleAxis={{ key: "name" }}
        showTooltip
      />
    );
  }

  if (config.chart_type === EAnalyticsChartType.TREEMAP) {
    const treeData: TreeMapItem[] = chartData.data.map((datum, i) => ({
      name: datum.name,
      value: datum.count,
      fillColor: COLORS[i % COLORS.length] ?? "#6172E8",
    }));

    return <TreeMapChart className={commonClassName} data={treeData} showTooltip />;
  }

  return null;
}
