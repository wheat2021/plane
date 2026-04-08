import { createContext, useContext } from "react";

export type TAnalyticsChartOption = { value: string; label: string };

export type TAnalyticsChartContext = {
  xAxisOptions: TAnalyticsChartOption[];
};

const AnalyticsChartContext = createContext<TAnalyticsChartContext | null>(null);

export const AnalyticsChartProvider = AnalyticsChartContext.Provider;

export function useAnalyticsChartContext(): TAnalyticsChartContext | null {
  return useContext(AnalyticsChartContext);
}
