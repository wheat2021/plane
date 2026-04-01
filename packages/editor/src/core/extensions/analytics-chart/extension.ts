import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { AnalyticsChartNodeView } from "./node-view";
import type { TAnalyticsChartConfig } from "./types";
import { EAnalyticsChartType } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.ANALYTICS_CHART]: {
      setAnalyticsChart: () => ReturnType;
    };
  }
}

export const analyticsChartInputRegex = /^```analytics[\s\n]$/;

const DEFAULT_CONFIG: TAnalyticsChartConfig = {
  chart_type: EAnalyticsChartType.BAR,
  x_axis: "PRIORITY",
};

export const AnalyticsChartExtension = Node.create({
  name: CORE_EXTENSIONS.ANALYTICS_CHART,
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      config: {
        default: {},
        parseHTML: (element) => {
          const b64 = element.getAttribute("data-config");
          if (!b64) return {};
          try {
            return JSON.parse(decodeURIComponent(escape(atob(b64)))) as TAnalyticsChartConfig;
          } catch {
            return {};
          }
        },
        renderHTML: (attributes) => {
          const config = attributes.config as TAnalyticsChartConfig | undefined;
          if (!config || Object.keys(config).length === 0) return {};
          try {
            const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
            return { "data-config": b64 };
          } catch {
            return {};
          }
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="analyticsChart"]',
        priority: 100,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "analyticsChart" })];
  },

  addCommands() {
    return {
      setAnalyticsChart:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { config: DEFAULT_CONFIG } }),
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: analyticsChartInputRegex,
        type: this.type,
        getAttributes: () => ({ config: DEFAULT_CONFIG }),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnalyticsChartNodeView);
  },
});
