import { createContext, useContext } from "react";

export type TAnalyticsChartOption = { value: string; label: string };

export type TAnalyticsChartContext = {
  xAxisOptions: TAnalyticsChartOption[];
  projectOptions?: TAnalyticsChartOption[];
  issueTypeOptions?: TAnalyticsChartOption[];
};

const AnalyticsChartContext = createContext<TAnalyticsChartContext | null>(null);

export const AnalyticsChartProvider = AnalyticsChartContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useAnalyticsChartContext(): TAnalyticsChartContext | null {
  return useContext(AnalyticsChartContext);
}
