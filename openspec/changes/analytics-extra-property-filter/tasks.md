## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal.md, design.md, specs/）到 git

## 2. 后端——issue_type 过滤支持

- [x] 2.1 验证 `member` 类型 extra property 在 `Issue.extra_properties` 中的实际存储格式（单值字符串 vs 数组），确认实现方案
- [x] 2.2 修改 `apps/api/plane/app/views/analytic/advance.py`：在 `custom-work-items` 分支中读取 `issue_type_id`（项目上下文）和 `issue_type_name`（工作区上下文）参数并传给 `build_analytics_chart`
- [x] 2.3 修改 `apps/api/plane/utils/build_chart.py`：`build_analytics_chart` 函数新增 `issue_type_id` 和 `issue_type_name` 参数，用于过滤 queryset（`type_id=issue_type_id` 或 `type__name=issue_type_name`）

## 3. 后端——extra property 分组支持

- [x] 3.1 修改 `apps/api/plane/utils/build_chart.py`：扩展 `x_axis_mapper` 和 `get_x_axis_field()`，支持 `extra_property:<config_key>` 格式（解析 config_key，映射为 `extra_properties__<config_key>` ORM 路径）
- [x] 3.2 修改 `build_analytics_chart`：去掉对 `x_axis_mapper` 的硬校验，允许 `extra_property:` 前缀的动态字段通过
- [x] 3.3 确认 `process_grouped_data` 已正确处理 null/None 情况（如未设置 extra property 的 Issue 归入 None 分组）

## 4. 前端——类型定义扩展

- [x] 4.1 修改 `packages/types/src/analytics.ts`：`IAnalyticsParams` 中以 `issue_type_id?: string` 替换 `y_axis: ChartYAxisMetric`；新增 `TAnalyticsXAxisProperty = ChartXAxisProperty | \`extra_property:${string}\``类型；更新`x_axis`和`group_by` 字段类型
- [x] 4.2 修改 `packages/constants/src/analytics/common.ts`：移除 `ANALYTICS_Y_AXIS_VALUES` 常量（不再使用）

## 5. 前端——新增 hook：useAnalyticsXAxisOptions

- [x] 5.1 在 `apps/web/core/components/analytics/` 下新建 hook `use-analytics-axis-options.ts`，参考 `apps/web/ce/components/issues/issue-layouts/utils.tsx` 中的 `useProjectSelectExtraProperties`
- [x] 5.2 hook 接受 `projectId?: string` 和 `workspaceSlug: string`：项目上下文时加载该项目的 select/member extra properties；工作区上下文时加载所有有权限项目（selectedProjects 或全部）的 select/member extra properties，按 config_key 去重
- [x] 5.3 hook 返回合并后的选项数组，格式：`{ value: TAnalyticsXAxisProperty; label: string }[]`，静态选项在前，extra property 选项在后

## 6. 前端——新增 hook：useAnalyticsIssueTypeOptions

- [x] 6.1 在同一 hooks 文件（或单独文件）中创建 `useAnalyticsIssueTypeOptions(projectId?: string, workspaceSlug: string)`
- [x] 6.2 项目上下文：调用 `store.issueType.getProjectIssueTypes(projectId)`，返回 issue type 列表（含"全部类型"默认选项）
- [x] 6.3 工作区上下文（无 projectId）：遍历所有有权限项目的 issue types，按名字合并去重，返回唯一名字列表

## 7. 前端——AnalyticsSelectParams 组件改造

- [x] 7.1 修改 `apps/web/core/components/analytics/select/analytics-params.tsx`：新增 `projectId?: string` prop
- [x] 7.2 移除 `y_axis` Controller 和 `SelectYAxis` 组件的调用；改为 Issue Type Controller，使用 `useAnalyticsIssueTypeOptions` 数据渲染下拉框 [UPSTREAM-RISK]
- [x] 7.3 将 x_axis 和 group_by 的选项来源替换为 `useAnalyticsXAxisOptions(projectId, workspaceSlug)` 的动态结果

## 8. 前端——projectId 透传

- [x] 8.1 修改 `apps/web/core/components/analytics/work-items/customized-insights.tsx`：新增 `projectId?: string` prop 并透传给 `AnalyticsSelectParams` [UPSTREAM-RISK]
- [x] 8.2 修改 `apps/web/core/components/analytics/work-items/modal/content.tsx`：将 `projectDetails?.id` 作为 `projectId` 传给 `CustomizedInsights` [UPSTREAM-RISK]
- [x] 8.3 修改工作区分析 root（`apps/web/core/components/analytics/work-items/root.tsx`）：调用 `CustomizedInsights` 时不传 `projectId`（保持工作区语义）

## 9. 前端——PriorityChart option_id → label 映射

- [x] 9.1 修改 `apps/web/core/components/analytics/work-items/priority-chart.tsx`：接受 `extraPropertyConfigs?: TExtraPropertyConfig[]` prop（或从 store 读取）
- [x] 9.2 在图表数据解析时，当 x_axis 或 group_by 为 `extra_property:` 格式时，使用 `ExtraPropertyConfig.options` 将 option_id 映射为 label；null/undefined 值显示为"无"
- [x] 9.3 将 extraPropertyConfigs 从 `AnalyticsSelectParams` 层级向下传递给 `PriorityChart`（或通过 store 获取）

## 10. 提交实现代码

- [x] 10.1 提交后端变更：`git commit -m "#FICC-9999# feat: 分析功能支持 issue type 过滤和 extra property 分组轴"`
- [x] 10.2 提交前端类型和常量变更：`git commit -m "#FICC-9999# feat: 扩展 IAnalyticsParams 类型支持 issue type 和 extra property"`
- [x] 10.3 提交前端组件变更：`git commit -m "#FICC-9999# feat: 自定义洞察添加 issue type 筛选器和 extra property 轴选项"`

## 11. 用户验证

- [ ] 11.1 **项目分析**：在侧边栏/全屏分析中，Issue Type 下拉框应显示该项目的所有 issue types + "全部类型"；选择特定类型后图表数据应过滤
- [ ] 11.2 **项目分析**：X 轴和分组下拉框中，应在静态选项（Priority/State/...）之后出现该项目的 select/member extra properties
- [ ] 11.3 **工作区分析**：Issue Type 下拉框应显示所有有权限项目 issue types 的合并列表（按名字去重）
- [ ] 11.4 **工作区分析**：X 轴和分组下拉框中，应出现所有有权限项目的 select/member extra properties（按 config_key 去重）
- [ ] 11.5 **图表渲染**：选择 extra property 作为分组时，图例应显示 option label 而非 UUID；未设置属性的工作项归入"无"分组
- [ ] 11.6 **互斥检查**：当 extra property 选为 X 轴时，同一属性不应出现在分组下拉框中（反之亦然）
