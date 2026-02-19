## Why

项目的 Views 和工作项列表界面已支持通过 Rich Filters 按 state、priority、assignee 等标准属性筛选工作项，但当前筛选器仅限于静态定义的标准属性，用户无法基于 Extra Properties（自定义属性）进行筛选。Extra Properties 已在 workspace 级别可配置，并已支持在视图中显示列，本次变更将把 Extra Properties 扩展为可筛选的维度，让用户可将自定义属性与标准属性组合使用来构建视图。

## What Changes

- 在筛选器属性列表中动态展示当前项目可用的 Extra Properties（基于 workspace 配置与 project-level 绑定）
- 根据 Extra Property 的数据类型（option/text/number/date 等）为其分配合适的筛选操作符
- 扩展 Rich Filter 表达式类型系统，支持以 `extra_property__<configId>` 为 key 的动态过滤条件
- 在后端过滤逻辑中处理 Extra Property 筛选条件，转换为对应的数据库查询

## Capabilities

### New Capabilities

- `extra-property-filter`：在 Views / 工作项列表的筛选器中支持按 Extra Properties 筛选，包括：动态加载项目可用的 extra property 配置、按属性类型适配筛选操作符、前端类型系统扩展、后端查询逻辑

### Modified Capabilities

（无现有 spec 级别的行为变更）

## Impact

**前端**

- `packages/types/src/view-props.ts`：扩展 `TWorkItemFilterProperty` 或引入新的动态 filter key 类型
- `packages/types/src/rich-filters/`：扩展 filter 表达式和条件类型
- `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx`：动态注入 extra property filter 配置
- `packages/utils/src/work-item-filters/configs/filters/`：新增 extra property filter 配置工厂函数

**后端**

- `apps/api/plane/utils/issue_filters.py`：新增 extra property 筛选条件的处理与数据库查询生成

**上游影响评估**

- `packages/types/src/view-props.ts`：上游有持续维护，类型扩展有冲突风险（中等）
- `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx`：CE 层文件，上游可能同步更新（中等）
- `apps/api/plane/utils/issue_filters.py`：上游核心后端工具，改动需注意向前兼容（中等）
- `packages/utils/src/work-item-filters/configs/filters/`（新增文件）：新文件，无冲突风险（低）
