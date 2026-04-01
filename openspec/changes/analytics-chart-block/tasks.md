## 1. 提交变更文档

- [ ] 1.1 将 `openspec/changes/analytics-chart-block/` 下所有文档（proposal.md、design.md、specs/、tasks.md）暂存并提交
  - 提交信息：`#FICC-9999# docs: 新增 analytics-chart-block 变更文档`

## 2. 类型与常量定义

- [ ] 2.1 在 `packages/editor/src/core/constants/extension.ts` 中新增枚举值 `ANALYTICS_CHART = "analyticsChart"` [UPSTREAM-RISK]
- [ ] 2.2 在 `packages/types/src/` 下（或 `packages/editor` 内部 types）新增 `TAnalyticsChartConfig` 类型定义，包含字段：`chart_type`、`x_axis`、`group_by`、`issue_type_id`、`issue_type_name`、`project_ids`、`duration`、`title`
- [ ] 2.3 新增图表类型枚举 `EAnalyticsChartType`（bar/line/area/pie/radar/treemap），可复用或扩展现有 `EChartModels`

## 3. TipTap 扩展核心

- [ ] 3.1 新建目录 `packages/editor/src/core/extensions/analytics-chart/`
- [ ] 3.2 创建 `extension.ts`：定义 `AnalyticsChartExtension`，`atom: true`，`addAttributes()` 注册 `config` 属性（默认值为空配置对象），`renderHTML` 序列化为 `data-type="analyticsChart" data-config=<base64(JSON)>`，`parseHTML` 从 `data-config` 反序列化，注册 `setAnalyticsChart` command
- [ ] 3.3 在 `extension.ts` 中注册 `addInputRules()`：匹配 ` ```analytics ` 触发插入
- [ ] 3.4 创建 `index.ts` 导出扩展

## 4. 配置面板组件

- [ ] 4.1 创建 `config-panel.tsx`：图表类型选择器（6 种图表图标网格，选中高亮）
- [ ] 4.2 在 `config-panel.tsx` 中实现参数表单：x_axis 下拉、group_by 下拉、工作项类型下拉、时间范围下拉、项目范围多选、标题输入框
- [ ] 4.3 实现图表类型与参数联动约束：Line/Area 时 x_axis 过滤为日期属性；Pie 时隐藏 group_by 并清空其值
- [ ] 4.4 复用现有 hooks：`useAnalyticsXAxisOptions`、`useAnalyticsIssueTypeOptions` 填充 x_axis 和工作项类型选项
- [ ] 4.5 实现"应用"/"预览"按钮，点击后回调 `onApply(config)` 通知 NodeView 切换模式

## 5. 图表渲染组件

- [ ] 5.1 创建 `chart-renderer.tsx`：根据 `config.chart_type` 渲染对应的 propel 图表组件（BarChart/LineChart/AreaChart/PieChart/RadarChart/TreeMap）
- [ ] 5.2 在 `chart-renderer.tsx` 中调用 `AnalyticsService.getAdvanceAnalyticsCharts()`，使用 SWR 管理请求缓存，根据 config 参数构造 query params
- [ ] 5.3 实现加载状态：显示 `ChartLoader` 骨架屏（复用现有 `analytics/loaders.tsx`）
- [ ] 5.4 实现空数据状态：使用 `EmptyStateCompact` 展示"暂无数据，请调整过滤条件"
- [ ] 5.5 实现 403 权限错误状态：显示"无权访问此数据，请检查项目权限"提示，附"⚙ 配置"入口按钮
- [ ] 5.6 实现通用 API 错误状态：显示"数据加载失败，请稍后重试"提示，附"重试"按钮

## 6. NodeView 主组件

- [ ] 6.1 创建 `node-view.tsx`：`AnalyticsChartNodeView` 组件，通过 `useParams()` 获取 `workspaceSlug`
- [ ] 6.2 实现两种模式状态：`mode: "preview" | "config"`，有完整配置时默认 `"preview"`，空配置时默认 `"config"`
- [ ] 6.3 预览模式：渲染 `chart-renderer.tsx`，悬浮时右上角浮出工具栏（"⚙ 配置" + "👁 预览"按钮），样式与 mermaid/drawio block 一致
- [ ] 6.4 配置模式：渲染 `config-panel.tsx`，顶部工具栏固定显示（"⚙ 配置" + "👁 预览"按钮），`onApply` 更新节点 attrs 并切换至预览模式（通过 `editor.commands.command()` 更新节点属性）
- [ ] 6.5 只读模式处理：从 `NodeViewProps` 的 `editor.isEditable` 判断只读状态，只读时隐藏"⚙ 配置"按钮
- [ ] 6.6 在 `extension.ts` 中通过 `ReactNodeViewRenderer(AnalyticsChartNodeView)` 绑定 NodeView

## 7. 注册扩展与 Slash Command

- [ ] 7.1 在 `packages/editor/src/core/extensions/index.ts` 中导出 `AnalyticsChartExtension` [UPSTREAM-RISK]
- [ ] 7.2 在 `packages/editor/src/core/extensions/extensions.ts` 中将 `AnalyticsChartExtension` 加入扩展列表 [UPSTREAM-RISK]
- [ ] 7.3 在 `packages/editor/src/core/constants/extension.ts` 的 `BLOCK_NODE_TYPES` 数组中追加 `ANALYTICS_CHART` [UPSTREAM-RISK]
- [ ] 7.4 在 `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx` 中新增 Analytics 图表条目（commandKey: "analytics"，title: "Analytics 图表"，searchTerms 含"analytics/图表/分析/chart"，command 调用 `setAnalyticsChart()`）[UPSTREAM-RISK]

## 8. 提交实现代码

- [ ] 8.1 暂存并提交 `packages/editor` 下所有改动（新增扩展目录、常量、类型）
  - 提交信息：`#FICC-9999# feat: 实现 analyticsChart TipTap 扩展（节点定义、序列化、slash command）`
- [ ] 8.2 暂存并提交 NodeView 及子组件（config-panel、chart-renderer、node-view）
  - 提交信息：`#FICC-9999# feat: 实现 analyticsChart 节点视图（配置面板、图表渲染、错误处理）`

## 9. 用户验证

- [ ] 9.1 在 Issue 描述编辑器中输入 `/analytics`，确认 Slash Command 菜单显示"Analytics 图表"条目，选择后插入空节点并进入配置模式
- [ ] 9.2 在配置模式中选择"Bar"图表类型，设置 x_axis 为"Priority"，点击"应用"，确认切换至预览模式并渲染柱状图
- [ ] 9.3 切换图表类型为"Line"，确认 x_axis 下拉仅显示日期属性（start_date/target_date/created_at/completed_at）
- [ ] 9.4 切换图表类型为"Pie"，确认 group_by 选择器隐藏
- [ ] 9.5 将 project_ids 设置为特定项目，确认图表数据仅包含该项目数据；清空为"全部项目"，确认数据范围切换为 workspace 级别
- [ ] 9.6 将 project_ids 设置为一个无权限项目，确认预览模式显示"无权访问此数据"提示，而非空白或崩溃
- [ ] 9.7 在 Issue 描述中插入两个 Analytics 图表节点，确认两者独立渲染、配置互不干扰
- [ ] 9.8 保存 Issue，刷新页面后重新打开，确认图表配置完整恢复（chart_type、x_axis、group_by、project_ids、title 均正确）
- [ ] 9.9 在只读视图（Issue 详情页非编辑态）下打开含 Analytics 图表的 Issue，确认图表正常渲染，无"⚙ 配置"按钮
