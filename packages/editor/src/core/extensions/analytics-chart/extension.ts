import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
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
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="analyticsChart"]',
        priority: 100,
        getAttrs: (element) => {
          const el = element;
          const b64 = el.getAttribute("data-config");
          if (!b64) return {};
          try {
            const config = JSON.parse(decodeURIComponent(escape(atob(b64)))) as TAnalyticsChartConfig;
            return { config };
          } catch {
            return {};
          }
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const config = node.attrs.config as TAnalyticsChartConfig | undefined;
    const configAttr =
      config && Object.keys(config).length > 0
        ? { "data-config": btoa(unescape(encodeURIComponent(JSON.stringify(config)))) }
        : {};
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "analyticsChart", ...configAttr })];
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("analytics-chart-form-events"),
        props: {
          handleDOMEvents: {
            mousedown(_view, event) {
              const target = event.target as HTMLElement;
              // Prevent ProseMirror from handling mousedown on form elements,
              // which would trigger NodeSelection and re-render, closing native dropdowns
              if (target.closest("select, input, textarea")) {
                return true;
              }
              return false;
            },
            keydown(_view, event) {
              const target = event.target as HTMLElement;
              // Prevent ProseMirror from handling keyboard events from form inputs.
              // Without this, ProseMirror intercepts keys (Backspace, Enter, arrow keys)
              // and the user cannot type in input/textarea fields inside the NodeView.
              if (target.closest("input, textarea")) {
                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});
