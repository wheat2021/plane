import { useContext } from "react";
import { AnalyticsChartContext } from "./context";
import type { TAnalyticsChartContext } from "./context";

export function useAnalyticsChartContext(): TAnalyticsChartContext | null {
  return useContext(AnalyticsChartContext as React.Context<TAnalyticsChartContext | null>);
}
