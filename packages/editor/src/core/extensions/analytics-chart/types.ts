import type { ChartXAxisProperty } from "@plane/types";

export enum EAnalyticsChartType {
  BAR = "bar",
  LINE = "line",
  AREA = "area",
  PIE = "pie",
  RADAR = "radar",
  TREEMAP = "treemap",
}

export type TAnalyticsChartConfig = {
  chart_type: EAnalyticsChartType;
  x_axis: ChartXAxisProperty | string;
  group_by?: ChartXAxisProperty | string;
  issue_type_id?: string;
  issue_type_name?: string;
  project_ids?: string[];
  duration?: string;
  title?: string;
};
