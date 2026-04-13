import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Eye, Settings } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { ChartRenderer } from "./chart-renderer";
import { ConfigPanel } from "./config-panel";
import { useAnalyticsChartContext } from "./use-analytics-chart-context";
import type { TAnalyticsChartConfig } from "./types";
import { EAnalyticsChartType } from "./types";

const DEFAULT_CONFIG: TAnalyticsChartConfig = {
  chart_type: EAnalyticsChartType.BAR,
  x_axis: "PRIORITY",
};

function isConfigComplete(config: TAnalyticsChartConfig): boolean {
  return !!(config?.chart_type && config?.x_axis);
}

export function AnalyticsChartNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const config = node.attrs.config as TAnalyticsChartConfig | undefined;
  const complete = isConfigComplete(config ?? ({} as TAnalyticsChartConfig));
  const [mode, setMode] = useState<"preview" | "config">(complete ? "preview" : "config");
  const isEditable = editor.isEditable;

  const chartCtx = useAnalyticsChartContext();

  // Extract workspaceSlug from URL path (first segment): /{workspaceSlug}/...
  const workspaceSlug =
    typeof window !== "undefined" ? (window.location.pathname.split("/").filter(Boolean)[0] ?? "") : "";

  // Save config to node attrs immediately
  function handleUpdate(newConfig: TAnalyticsChartConfig) {
    updateAttributes({ config: newConfig });
  }

  // Switch to preview
  function handleApply() {
    setMode("preview");
  }

  const toolbar = isEditable ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setMode("preview")}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
          mode === "preview" ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
        )}
      >
        <Eye className="size-3" />
        预览
      </button>
      <button
        type="button"
        onClick={() => setMode("config")}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors",
          mode === "config" ? "text-primary bg-layer-3" : "text-tertiary hover:text-primary hover:bg-layer-3"
        )}
      >
        <Settings className="size-3" />
        配置
      </button>
    </div>
  ) : null;

  return (
    <NodeViewWrapper className="analytics-chart-block my-2">
      {mode === "preview" ? (
        <div className="group relative border border-subtle rounded-lg overflow-hidden">
          {isEditable && (
            <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-layer-2 border border-subtle rounded-md shadow-sm px-1 py-0.5">
              {toolbar}
            </div>
          )}
          <div className="p-4">
            {config?.title && <p className="mb-3 text-sm font-medium text-primary">{config.title}</p>}
            {complete && workspaceSlug && config ? (
              <ChartRenderer
                config={config}
                workspaceSlug={workspaceSlug}
                onConfigClick={isEditable ? () => setMode("config") : undefined}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-secondary gap-2">
                <p>图表配置不完整</p>
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => setMode("config")}
                    className="flex items-center gap-1 rounded border border-subtle px-3 py-1.5 text-xs hover:bg-layer-3"
                  >
                    <Settings className="size-3" />
                    配置
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-subtle rounded-lg overflow-hidden" contentEditable={false}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-subtle bg-layer-2">
            <span className="text-xs font-medium text-tertiary">Analytics 图表</span>
            {toolbar}
          </div>
          <ConfigPanel
            config={config ?? DEFAULT_CONFIG}
            onUpdate={handleUpdate}
            onApply={handleApply}
            xAxisOptions={chartCtx?.xAxisOptions}
            projectOptions={chartCtx?.projectOptions}
            issueTypeOptions={chartCtx?.issueTypeOptions}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}
