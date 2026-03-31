## Context

自定义洞察（Customized Insights）当前架构：

- **Y 轴下拉框**：`ChartYAxisMetric` 枚举（Work Item Count / Estimate / Epic Count），社区版中 Estimate 和 Epic 均不可用，实质上只有一个有效选项
- **X 轴/分组下拉框**：`ANALYTICS_X_AXIS_VALUES` 静态常量数组，不感知 project/workspace 上下文
- **后端 `build_chart.py`**：`x_axis_mapper` 硬编码允许字段，通过 Django ORM 字段路径做 annotation/group
- **Extra Properties 数据模型**：`Issue.extra_properties` 是 JSONField，格式 `{config_key: value}`；`ExtraPropertyConfig` 存储 workspace 级别的属性配置；`IssueTypeExtraProperty` 存储 issue type 与 extra property 的绑定关系
- **Issue Type**：`Issue.type_id` FK → `IssueType`；前端已有 `store.issueType.getProjectIssueTypes(projectId)` 可用

## Goals / Non-Goals

**Goals:**

- Y 轴改为 Issue Type 筛选器（"全部类型" + 项目/工作区可用的 issue types）
- X 轴和分组下拉框追加 `select` 和 `member` 类型的 extra properties
- 项目上下文：仅显示该项目绑定的 extra properties 和 issue types
- 工作区上下文：显示所有有权限项目的 extra properties（select/member），issue types 按名字合并去重
- 后端支持 `issue_type_id` 过滤和 `extra_property:<config_key>` 分组

**Non-Goals:**

- 不支持 `multiselect` 类型 extra property 作为 X 轴/分组（JSON 数组展开需要 PostgreSQL 特定函数，后续迭代）
- 不支持 `text` / `number` / `date` 类型 extra property（不适合离散分组）
- 不修改工作区分析的总览（Overview）部分

## Decisions

### 决策 1：用 issue_type_id 替换 y_axis，而非新增参数

**选择**：在 `IAnalyticsParams` 中以 `issue_type_id?: string` 替换 `y_axis: ChartYAxisMetric`

**理由**：`y_axis` 在后端 `build_chart.py` 的 `build_analytics_chart` 函数中实际未被使用（`get_y_axis_filter` 只返回 `{"id": F("id")}`，是空操作）。社区版中 Estimate/Epic 不可用，保留 y_axis 只会混淆意图。issue_type_id 是纯过滤参数，语义清晰。

**备选方案**：保留 y_axis 并新增 issue_type_id → 引入两个无关参数，且 y_axis 仍无实际作用。

### 决策 2：extra property 的 x_axis 格式使用 `extra_property:<config_key>`

**选择**：沿用 group-by 已有的 `TExtraPropertyGroupBy = \`extra_property:${string}\`` 格式，定义 `TAnalyticsXAxisProperty = ChartXAxisProperty | \`extra_property:${string}\``

**理由**：前端 group-by 已使用此格式，保持一致性；后端可通过前缀判断区分普通字段和 extra property，config_key 可从中解析。

**备选方案**：用独立的 `extra_property_key` 参数传递 → 需要修改更多接口层，且无法区分 x_axis 和 group_by 分别是哪种类型。

### 决策 3：后端 extra property 值解析——返回原始 option_id，前端映射 label

**选择**：后端 `build_chart.py` 对 extra property 使用 `extra_properties__<config_key>` 做 annotation，返回 option_id（UUID 字符串）；前端 `PriorityChart` 组件持有 extra property config 并将 option_id 映射为可读 label。

**理由**：后端无需知晓 ExtraPropertyConfig 的选项列表，职责分离更清晰；前端已经在 group-by 渲染时做过 option_id→label 的映射，有成熟模式可复用。

**备选方案**：后端 JOIN ExtraPropertyConfig 返回 label → 增加后端查询复杂度，且 config 数据前端已缓存。

### 决策 4：工作区分析的 issue type 按名字合并

**选择**：工作区分析下拉框中，跨项目的同名 issue type 显示为同一选项；传给后端的是 `issue_type_name`（字符串），后端用 `type__name=...` 过滤。

**理由**：工作区视角下用户关心的是「类型语义」而非特定项目的 type ID；按名字合并减少重复选项，用户体验更好。

**备选方案**：按 ID 区分展示（A项目/Bug, B项目/Bug）→ 选项过多，且用户通常期望跨项目聚合。

### 决策 5：projectId 通过 prop 透传，不使用 analytics store

**选择**：在 `CustomizedInsights` 和 `AnalyticsSelectParams` 新增 `projectId?: string` prop，从 `WorkItemsModalMainContent` 的 `projectDetails.id` 透传。

**理由**：analytics store 中已有 `selectedProjects`（设置为 `[projectId]`），但直接用 prop 更明确，避免在 hook 中依赖 store 的 selectedProjects 数组（工作区场景下 selectedProjects 是用户筛选的多个项目，语义不同）。

## Risks / Trade-offs

- **[风险] extra_properties JSON 字段为空时**：`extra_properties__<config_key>` 可能返回 null → Mitigation：在 `build_chart.py` 中将 null 归入 "None" 分组（现有 `process_grouped_data` 已有此处理）

- **[风险] member 类型的 extra property 存储格式不确定**：可能是单个 user_id 字符串，也可能是数组 → Mitigation：实现前先验证实际存储格式，必要时只支持单值 member（non-array）

- **[取舍] issue type 按名字过滤**：若不同项目有同名但不同含义的 issue type（如都叫"Task"但属性不同），按名字合并可能导致歧义 → 接受此取舍，工作区视角本身就是聚合语义

- **[上游风险]** analytics 相关文件（`analytics-params.tsx`, `customized-insights.tsx`, `build_chart.py`）在上游活跃度较低，冲突风险小

## Migration Plan

无数据库 migration，无破坏性 API 变更（新增可选参数）。前端 `IAnalyticsParams` 类型变更需确保所有使用方更新（删除 `y_axis` 引用）。

## Open Questions

- member 类型 extra property 的实际存储格式（单值字符串 vs 数组）——实现前需验证
