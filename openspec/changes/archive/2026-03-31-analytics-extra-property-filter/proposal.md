## Why

自定义洞察的下拉框选项目前全部硬编码为静态常量（优先级、状态、负责人等），无法按 issue type 筛选数据，也无法按 extra property（自定义属性）进行 X 轴/分组分析。这使得拥有多种 issue type 和自定义属性的项目无法从分析功能中获得有价值的维度洞察。

## What Changes

- **替换** Y 轴下拉框为 Issue Type 选择器（Y 轴在社区版中实质无用，仅 Work Item Count 可用）
- **扩展** X 轴和分组下拉框，在静态选项之外追加 `select` 和 `member` 类型的 extra properties
- **新增** 后端对 `issue_type_id` 过滤参数的支持
- **新增** 后端对 `extra_property:<config_key>` 格式的 x_axis/group_by 参数支持
- **工作区分析**：issue type 按名字合并展示（跨项目同名 type 视为同一选项）；extra properties 展示所有有权限项目的 select/member 属性
- **项目分析**（侧边栏/全屏）：仅展示当前项目的 issue types 和 extra properties
- 不支持 `multiselect` 类型的分组（JSON 数组展开复杂度高，后续迭代）

## Capabilities

### New Capabilities

- `analytics-issue-type-filter`: 自定义洞察新增 issue type 筛选下拉框，替换无实质作用的 Y 轴选择器
- `analytics-extra-property-axis`: X 轴和分组下拉框支持 select/member 类型的 extra properties 作为分析维度

### Modified Capabilities

（无已有 spec 需要变更）

## Impact

**前端**

- `@plane/types`: `IAnalyticsParams` 新增 `issue_type_id?: string`，`x_axis`/`group_by` 类型扩展为支持 `extra_property:${string}` 格式
- `@plane/constants`: `ANALYTICS_X_AXIS_VALUES` 改为动态生成（或移除 Y 轴常量）
- `apps/web/core/components/analytics/select/analytics-params.tsx`: 核心改动，替换 y_axis Controller，动态加载 extra properties
- `apps/web/core/components/analytics/work-items/customized-insights.tsx`: 新增 `projectId` prop
- `apps/web/core/components/analytics/work-items/modal/content.tsx`: 透传 `projectDetails.id`

**后端**

- `apps/api/plane/utils/build_chart.py`: 支持 `issue_type_id` 过滤 + `EXTRA_PROPERTY__<key>` x_axis/group_by 解析
- `apps/api/plane/app/views/analytic/advance.py`: 新增参数读取并透传

**上游冲突风险**：analytics 相关文件在上游活跃度低，风险较低。
