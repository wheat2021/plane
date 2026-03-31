import { useMemo } from "react";
import type { ColumnDef, Row, RowData, Table } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane package imports
import { Download } from "lucide-react";
import type { ChartXAxisDateGrouping } from "@plane/constants";
import { ANALYTICS_X_AXIS_VALUES, CHART_COLOR_PALETTES, EChartModels } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TBarItem, TChart, TChartDatum, TAnalyticsXAxisProperty, TExtraPropertyConfig } from "@plane/types";
// plane web components
import { generateExtendedColors, parseChartData } from "@/components/chart/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { AnalyticsService } from "@/services/analytics.service";
import { exportCSV } from "../export";
import { DataTable } from "../insight-table/data-table";
import { ChartLoader } from "../loaders";
import { generateBarColor } from "./utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    export: {
      key: string;
      value: (row: Row<TData>) => string | number;
      label?: string;
    };
  }
}

const EXTRA_PROPERTY_PREFIX = "extra_property:";

interface Props {
  x_axis: TAnalyticsXAxisProperty;
  issue_type_id?: string;
  issue_type_name?: string;
  group_by?: TAnalyticsXAxisProperty;
  x_axis_date_grouping?: ChartXAxisDateGrouping;
  projectId?: string;
  workspaceSlug: string;
}

const analyticsService = new AnalyticsService();

const PriorityChart = observer(function PriorityChart(props: Props) {
  const { x_axis, issue_type_id, issue_type_name, group_by, workspaceSlug: workspaceSlugProp } = props;
  const { t } = useTranslation();
  // store hooks
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { workspaceStates } = useProjectState();
  const { resolvedTheme } = useTheme();
  const { getConfigsByWorkspace } = useExtraPropertyConfig();
  const { getUserDetails } = useMember();
  // router — use prop first (for modal context), fall back to URL param
  const routeParams = useParams();
  const workspaceSlug = (routeParams.workspaceSlug ?? workspaceSlugProp).toString();

  const { data: priorityChartData, isLoading: priorityChartLoading } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}-${selectedProjects?.join(",")}-${selectedCycle}-${selectedModule}-${x_axis}-${issue_type_id}-${issue_type_name}-${group_by}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<TChart>(
        workspaceSlug,
        "custom-work-items",
        {
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
          ...(issue_type_id ? { issue_type_id } : {}),
          ...(issue_type_name ? { issue_type_name } : {}),
          x_axis,
          ...(group_by ? { group_by } : {}),
        },
        isPeekView
      )
  );

  const extraPropertyConfigs = useMemo<TExtraPropertyConfig[]>(
    () => getConfigsByWorkspace(workspaceSlug) ?? [],
     
    [workspaceSlug, getConfigsByWorkspace]
  );

  /** Map a raw backend key (option_id / user_id / "None") to a human-readable label. */
  const resolveExtraPropertyLabel = useMemo(
    () =>
      (axisValue: TAnalyticsXAxisProperty | undefined, rawKey: string): string => {
        if (!axisValue?.startsWith(EXTRA_PROPERTY_PREFIX)) return rawKey;
        const configKey = axisValue.slice(EXTRA_PROPERTY_PREFIX.length);
        const config = extraPropertyConfigs.find((c) => c.key === configKey);
        if (!config) return rawKey;
        if (!rawKey || rawKey === "none" || rawKey === "None" || rawKey === "null") return "无";
        if (config.type === "select") {
          const option = config.options?.find((o: { value: string; label?: string }) => o.value === rawKey);
          return option?.label ?? rawKey;
        }
        if (config.type === "member") {
          const user = getUserDetails(rawKey);
          return user?.display_name ?? rawKey;
        }
        return rawKey;
      },
    [extraPropertyConfigs, getUserDetails]
  );

  const rawParsedData = useMemo(
    () => priorityChartData && parseChartData(priorityChartData, x_axis, group_by, props.x_axis_date_grouping),
    [priorityChartData, x_axis, group_by, props.x_axis_date_grouping]
  );

  // Remap extra property raw keys (option IDs / user IDs) to human-readable labels
  const parsedData = useMemo(() => {
    if (!rawParsedData) return undefined;
    const isExtraX = x_axis?.startsWith(EXTRA_PROPERTY_PREFIX);
    const isExtraGroup = group_by?.startsWith(EXTRA_PROPERTY_PREFIX);
    if (!isExtraX && !isExtraGroup) return rawParsedData;

    const remappedData = rawParsedData.data.map((datum) => ({
      ...datum,
      name: isExtraX ? resolveExtraPropertyLabel(x_axis, datum.name) : datum.name,
    })) as TChartDatum[];

    const remappedSchema: Record<string, string> = {};
    for (const key of Object.keys(rawParsedData.schema)) {
      remappedSchema[key] = isExtraGroup ? resolveExtraPropertyLabel(group_by, key) : rawParsedData.schema[key];
    }

    return { data: remappedData, schema: remappedSchema };
  }, [rawParsedData, x_axis, group_by, resolveExtraPropertyLabel]);

  const chart_model = group_by ? EChartModels.STACKED : EChartModels.BASIC;

  const bars: TBarItem<string>[] = useMemo(() => {
    if (!parsedData) return [];
    let parsedBars: TBarItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const baseColors = CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"];
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);

    if (chart_model === EChartModels.BASIC) {
      parsedBars = [
        {
          key: "count",
          label: "Count",
          stackId: "bar-one",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          fill: (payload) => generateBarColor(payload.key, { x_axis, group_by }, baseColors, workspaceStates),
          textClassName: "",
          showPercentage: false,
          showTopBorderRadius: () => true,
          showBottomBorderRadius: () => true,
        },
      ];
    } else if (chart_model === EChartModels.STACKED && parsedData.schema) {
      const parsedExtremes: Record<string, { top: string | null; bottom: string | null }> = {};
      parsedData.data.forEach((datum) => {
        let top = null;
        let bottom = null;
        for (const key of schemaKeys) {
          if ((datum as Record<string, number>)[key] === 0) continue;
          if (!bottom) bottom = key;
          top = key;
        }
        parsedExtremes[datum.key] = { top, bottom };
      });

      parsedBars = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: "bar-one",
        fill: extendedColors[index],
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: (value, payload: TChartDatum) => parsedExtremes[payload.key]?.top === value,
        showBottomBorderRadius: (value, payload: TChartDatum) => parsedExtremes[payload.key]?.bottom === value,
      }));
    } else {
      parsedBars = [];
    }
    return parsedBars;
  }, [chart_model, group_by, parsedData, resolvedTheme, workspaceStates, x_axis]);

  const xAxisLabel = useMemo(() => {
    if (x_axis?.startsWith(EXTRA_PROPERTY_PREFIX)) {
      const configKey = x_axis.slice(EXTRA_PROPERTY_PREFIX.length);
      return extraPropertyConfigs.find((c) => c.key === configKey)?.label ?? configKey;
    }
    return ANALYTICS_X_AXIS_VALUES.find((item) => item.value === x_axis)?.label ?? x_axis;
  }, [x_axis, extraPropertyConfigs]);

  const defaultColumns: ColumnDef<TChartDatum>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => xAxisLabel,
        meta: {
          export: {
            key: xAxisLabel,
            value: (row) => row.original.name,
            label: xAxisLabel,
          },
        },
      },
      {
        accessorKey: "count",
        header: () => <div className="text-right">Count</div>,
        cell: ({ row }) => <div className="text-right">{row.original.count}</div>,
        meta: {
          export: {
            key: "Count",
            value: (row) => row.original.count,
            label: "Count",
          },
        },
      },
    ],
    [xAxisLabel]
  );

  const columns: ColumnDef<TChartDatum>[] = useMemo(
    () =>
      parsedData
        ? Object.keys(parsedData?.schema ?? {}).map((key) => ({
            accessorKey: key,
            header: () => <div className="text-right">{parsedData.schema[key]}</div>,
            cell: ({ row }) => (
              <div className="text-right">{(row.original as Record<string, unknown>)[key] as number}</div>
            ),
            meta: {
              export: {
                key,
                value: (row) => (row.original as Record<string, unknown>)[key] as number,
                label: parsedData.schema[key],
              },
            },
          }))
        : [],
    [parsedData]
  );

  return (
    <div className="flex flex-col gap-12">
      {priorityChartLoading ? (
        <ChartLoader />
      ) : parsedData?.data && parsedData.data.length > 0 ? (
        <>
          <BarChart
            className="h-[370px] w-full"
            data={parsedData.data}
            bars={bars}
            margin={{ bottom: 30 }}
            xAxis={{
              key: "name",
              label: xAxisLabel.replace("_", " "),
              dy: 30,
            }}
            yAxis={{
              key: "count",
              label: t("common.no_of", { entity: "Work item" }),
              offset: -60,
              dx: -26,
            }}
          />
          <DataTable
            data={parsedData.data}
            columns={[...defaultColumns, ...columns]}
            searchPlaceholder={`${parsedData.data.length} ${xAxisLabel}`}
            actions={(table: Table<TChartDatum>) => (
              <Button
                variant="secondary"
                prependIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => exportCSV(table.getRowModel().rows, [...defaultColumns, ...columns], workspaceSlug)}
              >
                <div>{t("exporter.csv.short_description")}</div>
              </Button>
            )}
          />
        </>
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_work_items.title")}
        />
      )}
    </div>
  );
});

export default PriorityChart;
