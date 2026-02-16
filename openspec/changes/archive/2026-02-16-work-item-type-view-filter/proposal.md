## Why

项目视图（Project Views）目前不支持按工作项类型（Work Item Type）进行筛选，用户无法在保存的视图中过滤特定类型的工作项（如 Bug、Feature 等）。这限制了视图的灵活性和实用性，尤其是在启用了多种工作项类型的项目中。

## What Changes

- 在项目视图的筛选器中新增工作项类型（Issue Type）筛选选项
- 工作项类型筛选器仅显示当前项目已启用的工作项类型
- 支持在 rich_filters 表达式中使用 `type_id` 字段进行筛选
- 视图保存时持久化工作项类型筛选条件

## Capabilities

### New Capabilities

- `work-item-type-view-filter`: 在项目视图中支持按工作项类型筛选的能力，包括筛选器 UI 组件、筛选条件解析和 API 查询参数处理

### Modified Capabilities

（无需修改现有 spec 级别的需求）

## Impact

**前端代码影响：**
- `packages/types/src/view-props.ts`: 添加 `type_id` 到 `WORK_ITEM_FILTER_PROPERTY_KEYS`
- `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx`: 添加工作项类型筛选器配置
- `apps/web/ce/helpers/work-item-filters/project-level.ts`: 可能需要扩展以获取项目的工作项类型
- `packages/utils`: 可能需要添加 `getIssueTypeFilterConfig` 工具函数

**后端代码影响：**
- 视图 API 需要支持 `type_id` 筛选参数的解析和查询

**上游同步风险：**
- `packages/types/src/view-props.ts`: 中等风险 - 类型定义文件可能被上游修改
- `apps/web/ce/hooks/work-item-filters/`: 低风险 - CE 扩展点设计用于定制
