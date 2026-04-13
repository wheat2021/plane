import { createContext } from "react";

export type TAnalyticsChartOption = { value: string; label: string };

export type TAnalyticsChartContext = {
  xAxisOptions: TAnalyticsChartOption[];
  projectOptions?: TAnalyticsChartOption[];
  issueTypeOptions?: TAnalyticsChartOption[];
};

const AnalyticsChartContext = createContext<{
  xAxisOptions: TAnalyticsChartOption[];
  projectOptions?: TAnalyticsChartOption[];
  issueTypeOptions?: TAnalyticsChartOption[];
} | null>(null);

export const AnalyticsChartProvider = AnalyticsChartContext.Provider;
