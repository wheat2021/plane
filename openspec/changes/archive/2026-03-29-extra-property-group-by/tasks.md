## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）到 git

## 2. 类型系统扩展（packages/types）

- [x] 2.1 `packages/types/src/view-props.ts`：新增 `TExtraPropertyGroupBy = \`extra_property:${string}\``，将其加入 `TIssueGroupByOptions` 联合类型
- [x] 2.2 `packages/types/src/issues.ts`：将 `TExtraPropertyGroupBy` 加入 `GroupByColumnTypes` 联合类型

## 3. 前端常量与 Store 改造

- [x] 3.1 `apps/web/core/store/issue/helpers/base-issues.store.ts` [UPSTREAM-RISK]：新增 `getGroupByKey(groupBy)` 辅助函数（带 `extra_property:` 前缀判断），替换所有直接使用 `ISSUE_GROUP_BY_KEY[groupBy]` 的调用点（约 5 处）
- [x] 3.2 `apps/web/core/store/issue/helpers/base-issues.store.ts`：同步替换 `ISSUE_FILTER_DEFAULT_DATA[groupBy]` 的所有调用点使用 `getGroupByKey`

## 4. 前端分组列生成

- [x] 4.1 `apps/web/core/components/issues/issue-layouts/utils.tsx` [UPSTREAM-RISK]：新增 `getExtraPropertySelectColumns(propKey, projectId)` 函数，从 store 读取 select 属性的选项，生成含 options 列、`"None"` 列、`"__none_unsupported__"` 列（`isDropDisabled: true`）的 `IGroupByColumn[]`
- [x] 4.2 `apps/web/core/components/issues/issue-layouts/utils.tsx`：在 `getGroupByColumns` 中新增 `extra_property:*` 前缀判断分支，调用 `getExtraPropertySelectColumns`

## 5. 前端分组选项 UI

- [x] 5.1 `apps/web/ce/components/issues/issue-layouts/utils.tsx`：新增 `useProjectSelectExtraProperties(projectId)` hook，从 `issueTypeExtraProperty.getBindings` 聚合 + 过滤 type === "select" 的 extra property 配置
- [x] 5.2 `apps/web/ce/components/issues/issue-layouts/utils.tsx`：在 `useGroupByOptions` 中接收 `projectId` 参数，追加 `extra_property:*` 动态选项
- [x] 5.3 `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/group-by.tsx` [UPSTREAM-RISK]：传入 `projectId`，在现有选项列表后渲染 extra property 分组选项区块

## 6. 拖拽更新 extra property

- [x] 6.1 `apps/web/core/components/issues/issue-layouts/utils.tsx`：在 `handleGroupDragDrop` 中新增 `extra_property:*` 分支，直接操作 `issue.extra_properties[propKey]`，不走 `ISSUE_FILTER_DEFAULT_DATA` 映射
- [x] 6.2 验证拖入 `"__none_unsupported__"` 列时防御性 early return（正常由 `isDropDisabled` 阻止，此处为双重保障）

## 7. filter store 校验

- [x] 7.1 在 `apps/web/core/store/issue/project/filter.store.ts` 初始化时（读取 localStorage 后），若 `group_by` 以 `extra_property:` 开头且当前项目无该 key 的 select 属性绑定，则重置为 `null`

## 8. 后端 grouper 改造

- [x] 8.1 `apps/api/plane/utils/grouper.py`：新增 `ep_annotation_name(group_by)` 工具函数（`extra_property:severity` → `ep__severity`）
- [x] 8.2 `apps/api/plane/utils/grouper.py`：在 `issue_queryset_grouper` 中新增 `project_id` 参数，处理 `extra_property:*` 分组：使用 `KeyTextTransform` + `Case/When` 注入 annotation，区分 `"__none_unsupported__"` 与 `"None"`
- [x] 8.3 `apps/api/plane/utils/grouper.py`：在 `issue_group_values` 中新增 `extra_property:*` 分支，从 `ExtraPropertyConfig.config['options']` 返回选项值列表 + `["None", "__none_unsupported__"]`
- [x] 8.4 `apps/api/plane/utils/grouper.py`：在 `issue_on_results` 中新增逻辑：当 `group_by`/`sub_group_by` 以 `extra_property:` 开头时，将 annotation 名加入 `required_fields`，并在返回前过滤掉所有 `ep__` 开头的字段

## 9. 后端视图层适配

- [x] 9.1 `apps/api/plane/app/views/issue/base.py` [UPSTREAM-RISK]：`issue_queryset_grouper` 调用传入 `project_id=project_id`；paginator 的 `group_by_field_name` 参数改用 `ep_annotation_name(group_by)` 处理（3 处调用点）
- [x] 9.2 `apps/api/plane/app/views/module/issue.py`：同 9.1（2 处调用点）
- [x] 9.3 `apps/api/plane/app/views/cycle/issue.py`：同 9.1（2 处调用点）
- [x] 9.4 `apps/api/plane/app/views/issue/archive.py`：同 9.1（1 处调用点）

## 10. 提交实现代码

- [ ] 10.1 提交类型系统与常量改动：`git commit -m "#FICC-9999# feat: 扩展 TIssueGroupByOptions 支持 extra_property 模板字面量类型"`
- [ ] 10.2 提交前端分组列与拖拽逻辑：`git commit -m "#FICC-9999# feat: list/kanban 视图支持按 select 类型 extra property 分组"`
- [ ] 10.3 提交后端 grouper 改造：`git commit -m "#FICC-9999# feat: 后端支持 extra_property JSONB 分组查询，区分双 None 分组"`
- [ ] 10.4 提交视图层适配：`git commit -m "#FICC-9999# feat: 各 issue 视图传递 project_id 支持 extra property 分组参数"`

## 11. 用户验证

- [x] 11.1 在项目中配置一个 select 类型 extra property（如「严重等级」，选项：高/中/低），绑定到至少一个 issue type
- [x] 11.2 进入 list 视图，打开「分组方式」面板，验证「严重等级」出现在选项列表中
- [x] 11.3 选择「严重等级」分组，验证视图出现「高」「中」「低」「未设置」「不适用」分组列
- [x] 11.4 验证有值工作项出现在正确列；无值但属于绑定类型的工作项在「未设置」列；无绑定类型的工作项在「不适用」列
- [x] 11.5 拖拽一个工作项到另一个选项列，验证 extra property 值被正确更新（刷新后仍保持）
- [x] 11.6 拖拽工作项到「未设置」列，验证 extra property 值被清空
- [x] 11.7 尝试拖拽工作项到「不适用」列，验证操作被阻止并显示提示信息
- [x] 11.8 切换到无「严重等级」属性的项目，验证「分组方式」面板不显示该属性，且 URL 中若有 `group_by=extra_property:severity` 时被自动重置
