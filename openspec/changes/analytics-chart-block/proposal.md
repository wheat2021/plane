## Why

分析图表目前只存在于独立的 Analytics 页面，用户无法将数据洞察与 Issue 上下文直接关联。通过将分析图表作为 Editor 控件嵌入 Issue 描述，用户可以在任意 Issue 中自由组合实时数据图表，构建上下文化的分析报告，无需离开当前工作流。

## What Changes

- **新增** TipTap `analyticsChart` Block 节点扩展（`packages/editor`），支持在富文本编辑器中嵌入实时分析图表
- **新增** 两种模式切换：默认预览模式（渲染实时图表）、配置模式（可视化参数面板）
- **新增** Slash Command `/analytics` 触发插入
- **新增** 输入规则 ` ```analytics ` 触发插入
- **新增** 图表类型选择：Bar（柱状）、Line（折线）、Area（面积）、Pie（饼图）、Radar（雷达）、TreeMap（树图）
- **新增** 图表参数配置：x_axis、group_by、issue_type、duration、project_ids（跨项目）
- **新增** 图表类型与参数的联动约束（如 Line/Area 仅支持日期类 x_axis）
- **新增** 权限不足或 API 错误时的清晰提示信息
- 复用现有 `advance-analytics-charts` API，无需后端改动

## Capabilities

### New Capabilities

- `analytics-chart-block`: 在富文本编辑器中插入和渲染分析图表块，支持多种图表类型、参数配置和跨项目数据查询

### Modified Capabilities

（无现有能力变更）

## Impact

**代码影响：**

- `packages/editor/src/core/extensions/analytics-chart/`（新建目录）
- `packages/editor/src/core/constants/extension.ts`（新增枚举）
- `packages/editor/src/core/extensions/extensions.ts`（注册扩展）
- `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx`（新增 slash command）

**依赖：**

- `@plane/propel/charts`（已有：bar-chart、line-chart、area-chart、pie-chart、radar-chart、tree-map）
- `AnalyticsService.getAdvanceAnalyticsCharts()`（已有）
- `useAnalyticsXAxisOptions`、`useAnalyticsIssueTypeOptions` hooks（已有）

**上游冲突风险：**

- `extensions.ts`、`command-items-list.tsx` 属于核心编辑器文件，上游可能同步修改，合并时需注意冲突
- 新建的 `analytics-chart/` 目录为纯新增，无冲突风险
