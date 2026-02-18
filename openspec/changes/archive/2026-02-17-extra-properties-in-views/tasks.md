## 1. 类型定义扩展

- [x] 1.1 在 `packages/types/src/view-props.ts` 中扩展视图相关类型，添加 `extra_display_properties?: Record<string, boolean>` 字段到 `IIssueFilters`、`IProjectViewProps`、`IWorkspaceViewProps` 等接口 [UPSTREAM-RISK]
- [x] 1.2 在 `packages/types/src/views.ts` 中为 `IProjectView` 添加 `extra_display_properties` 字段 [UPSTREAM-RISK]

## 2. Backend 数据库迁移

- [x] 2.1 创建迁移文件 `0073_add_extra_display_properties_to_project_user_property.py`，为 `ProjectUserProperty` 模型添加 `extra_display_properties` JSONField
- [x] 2.2 创建迁移文件 `0074_add_extra_display_properties_to_issue_view.py`，为 `IssueView` 模型添加 `extra_display_properties` JSONField

## 3. Display 面板额外属性选择器

- [x] 3.1 创建 `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/extra-display-properties.tsx` 组件，实现额外属性选择器 UI
- [x] 3.2 在 `display-filters-selection.tsx` 中集成 `ExtraDisplayProperties` 组件
- [x] 3.3 添加 i18n 翻译键到 `packages/i18n/src/locales/{en,zh-CN,zh-TW}/translations.ts`
  - `issue.display.extra_properties.label`
  - `issue.display.extra_properties.not_available`

## 4. Filter Store 扩展

- [x] 4.1 扩展 `apps/web/core/store/issue/helpers/issue-filter-helper.store.ts` 支持 `extra_display_properties` 的读写 [UPSTREAM-RISK]
- [x] 4.2 在 `ProjectViewIssuesFilter` (project-views/filter.store.ts) 中添加 `extraDisplayProperties` getter 和 `updateFilters` 的 `EXTRA_DISPLAY_PROPERTIES` case
- [x] 4.3 在 `ProjectIssueFilter` (project/filter.store.ts) 中添加 `extraDisplayProperties` getter
- [x] 4.4 在 `CycleIssueFilter` (cycle/filter.store.ts) 中添加 `extraDisplayProperties` getter
- [x] 4.5 在 `ModuleIssueFilter` (module/filter.store.ts) 中添加 `extraDisplayProperties` getter
- [x] 4.6 更新 `computedDisplayFilters` 逻辑，合并额外属性显示配置

## 5. WorkItemLayoutAdditionalProperties 实现

- [x] 5.1 在 `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx` 实现额外属性渲染逻辑
- [x] 5.2 添加属性有效性检查，使用 `useIssueTypeExtraProperty().getConfigIdsByIssueType()` 判断属性是否对当前类型有效
- [x] 5.3 实现禁用状态样式，对无效属性显示灰色不可操作 UI 并带 Tooltip 提示
- [x] 5.4 实现属性值编辑功能，调用 `updateIssue` API 更新 `extra_properties`

## 6. 紧凑型额外属性控件

- [x] 6.1 创建 `apps/web/core/components/issues/extra-properties/compact-controls/` 目录
- [x] 6.2 实现 `compact-text.tsx` - 紧凑型文本控件（点击展开编辑）
- [x] 6.3 实现 `compact-select.tsx` - 紧凑型下拉选择控件
- [x] 6.4 实现 `compact-checkbox.tsx` - 紧凑型复选框控件
- [x] 6.5 创建 `compact-extra-property-control.tsx` 统一入口组件

## 7. List 布局集成

- [x] 7.1 修改 `base-list-root.tsx` 获取 `extraDisplayProperties` 并传递给 `ListLayout`
- [x] 7.2 更新 `default.tsx` (ListLayout) 添加 `extraDisplayProperties` 到 `IListLayout` 接口
- [x] 7.3 修改 `list-group.tsx` 传递 `extraDisplayProperties` 到 `IssuesLoader`
- [x] 7.4 修改 `blocks-list.tsx` 传递到 `IssueBlockRoot`
- [x] 7.5 修改 `block-root.tsx` 传递到 `IssueBlock`
- [x] 7.6 修改 `block.tsx` 传递到 `AllIssueProperties`
- [x] 7.7 修改 `all-properties.tsx` 传递到 `WorkItemLayoutAdditionalProperties`

## 8. Kanban 布局集成

- [x] 8.1 修改 `base-kanban-root.tsx` 获取 `extraDisplayProperties` 并传递
- [x] 8.2 更新 `default.tsx` (KanBan) 添加到 `IKanBan` 接口，传递到 `KanbanGroup`
- [x] 8.3 更新 `kanban-group.tsx` 的 `IKanbanGroup` 接口并传递到 `KanbanIssueBlocksList`
- [x] 8.4 更新 `blocks-list.tsx` 的 `IssueBlocksListProps` 并传递到 `KanbanIssueBlock`
- [x] 8.5 更新 `block.tsx` 的 `IssueBlockProps` 和 `IssueDetailsBlockProps`，传递到 `KanbanIssueDetailsBlock` 和 `IssueProperties`
- [x] 8.6 确保 `IssueProperties` 组件接收并传递 `extraDisplayProperties` 到 `WorkItemLayoutAdditionalProperties`

## 9. Kanban Swimlanes 布局集成

- [x] 9.1 更新 `swimlanes.tsx` 添加 `extraDisplayProperties` 到 `IKanBanSwimLanes` 接口
- [x] 9.2 添加到 `ISubGroupSwimlane` 接口并传递到 `KanBan` 组件
- [x] 9.3 添加到 `ISubGroupSwimlaneHeader` 接口（虽然该组件不直接使用，但保持类型一致）

## 10. Spreadsheet 布局完整实现

- [x] 10.1 修改 `base-spreadsheet-root.tsx` 获取 `extraDisplayProperties` 并传递到 `SpreadsheetView`
- [x] 10.2 更新 `spreadsheet-view.tsx` 的 `Props` 接口并传递到 `SpreadsheetTable`
- [x] 10.3 更新 `spreadsheet-table.tsx` 传递到 `SpreadsheetHeader` 和 `SpreadsheetIssueRow`
- [x] 10.4 实现 `spreadsheet-header.tsx` 中的额外属性列头渲染
  - 导入 `useExtraPropertyConfig` hook
  - 为每个选中的 extra property 创建独立的 `<th>` 列头
  - 列头显示属性的 `label`
- [x] 10.5 实现 `spreadsheet-issue-row.tsx` (`IssueRowDetails`) 中的数据单元格渲染
  - 导入 `useExtraPropertyConfig` 和 `useIssueTypeExtraProperty` hooks
  - 导入 `CompactExtraPropertyControl` 组件
  - 计算 `validConfigIds` 判断属性是否对当前 issue 有效
  - 为每个 extra property 创建独立的 `<td>` 单元格
  - 无效属性显示灰色 "—" 占位符，有效属性使用 `CompactExtraPropertyControl` 渲染
- [x] 10.6 实现属性有效性验证逻辑
  - `isValid = validConfigIds.size === 0 || validConfigIds.has(configId)`
  - 当 `validConfigIds` 为空时，允许所有 extra properties（表示 work item type 无限制）

## 11. Display 按钮逻辑修复

- [x] 11.1 修复 Cycle、Module、Project Views 的 Header 组件中 Display 按钮的显示逻辑
- [x] 11.2 确保 Display 按钮在所有视图类型中正常工作

## 12. 数据获取与缓存

- [x] 12.1 在 Display 面板打开时触发 `ExtraPropertyConfigStore.fetchWorkspaceConfigs()` (已在 extra-display-properties.tsx 中实现)
- [x] 12.2 在工作项列表加载时预取当前项目所有类型的额外属性绑定 (现有缓存机制已可用)

## 13. 测试与验证

- [x] 13.1 验证 Display 面板额外属性选择器正常工作
  - 选择器正常显示工作空间的所有 extra properties
  - 点击切换选中状态正常
  - 配置正确持久化到视图数据
- [x] 13.2 验证 List 视图额外属性渲染（有效/无效状态）
  - 有效属性显示为可编辑控件
  - 无效属性显示为灰色禁用状态带 Tooltip
- [x] 13.3 验证 Kanban 视图额外属性渲染
  - 卡片中正确显示额外属性
  - 有效/无效状态渲染正确
- [x] 13.4 验证 Spreadsheet 视图额外属性列
  - 每个 extra property 显示为独立列
  - 列头显示正确的属性名称
  - 数据单元格正确渲染和编辑
  - 有效性验证逻辑正常工作
- [x] 13.5 验证属性值编辑功能
  - 编辑后值正确更新
  - UI 乐观更新
- [x] 13.6 运行 `pnpm check` 确保类型和 lint 检查通过

## 14. 调试与问题修复

- [x] 14.1 修复 List layout 中 extra properties 无法显示的问题
  - 组件传递链断裂问题排查和修复
- [x] 14.2 修复 Board (Kanban) layout 中 extra properties 无法显示的问题
  - 数据流传递完整性检查和修复
- [x] 14.3 修复 Spreadsheet layout 结构问题
  - 添加缺失的列头
  - 修正列重叠样式问题
- [x] 14.4 修复 Spreadsheet layout 布局为单一列而非每个属性独立列的问题
  - 重构为每个 extra property 一列
  - 使用 `CompactExtraPropertyControl` 渲染各列
- [x] 14.5 修复所有 extra properties 显示为不可用的问题
  - 分析 `getConfigIdsByIssueType` 返回空数组的情况
  - 调整验证逻辑：空集合表示无限制，允许所有属性
