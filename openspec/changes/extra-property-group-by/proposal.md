## Why

当前 list/kanban 视图的分组功能（Group By）仅支持默认属性（状态、优先级、标签、负责人等），无法按 extra property 分组。用户配置了自定义的 select 类型 extra property（如"部门"、"严重等级"）后，无法在列表视图中按这些属性对工作项进行分组查看，降低了自定义属性的实用价值。

## What Changes

- 在 list 和 kanban 视图的「分组方式」选择器中，新增当前项目已配置的 `select` 类型 extra property 作为可选分组字段
- 按 extra property 分组时，展示三类分组列：各选项值对应的列、「未设置」列（属于该类型但未填写值）、「不适用」列（issue 类型未绑定该属性）
- 支持拖拽工作项到目标分组列，自动更新对应 extra property 的值
- 「不适用」列禁止拖入（issue 类型本身不支持该属性，无法通过拖拽设置）
- 后端通过 `group_by=extra_property:{key}` 参数格式传递，使用 JSONB 字段查询实现分组

## Capabilities

### New Capabilities

- `extra-property-group-by`：list/kanban 视图按 select 类型 extra property 分组，包含前端分组列生成、拖拽更新、后端 JSONB 分组查询、双 None 分组区分的完整实现

### Modified Capabilities

（无现有 spec 层行为变更）

## Impact

**前端：**

- `packages/types/src/view-props.ts` — `TIssueGroupByOptions` 扩展模板字面量类型
- `packages/types/src/issues.ts` — `GroupByColumnTypes` 扩展
- `apps/web/core/store/issue/helpers/base-issues.store.ts` — `ISSUE_GROUP_BY_KEY` / `ISSUE_FILTER_DEFAULT_DATA` 函数化
- `apps/web/core/components/issues/issue-layouts/utils.tsx` — `getGroupByColumns` 新增 extra property 分支，`handleGroupDragDrop` 特殊处理
- `apps/web/ce/components/issues/issue-layouts/utils.tsx` — `useGroupByOptions` 动态注入 extra property 选项
- `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/group-by.tsx` — UI 展示 extra property 选项区块

**后端：**

- `apps/api/plane/utils/grouper.py` — `issue_queryset_grouper`（JSONB KeyTextTransform + Case/When 双 None）、`issue_group_values`（返回选项列表）、`issue_on_results`（annotation 字段）
- `apps/api/plane/app/views/issue/base.py`、`module/issue.py`、`cycle/issue.py`、`issue/archive.py` — 传递 `project_id`、sanitize `group_by_field_name`
