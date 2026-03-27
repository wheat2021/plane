## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal.md、design.md、specs/）
- [x] 1.2 提交信息：`#FICC-9999# docs: 新增 default-property-description-tooltip-unify 变更文档`

## 2. 修改 Tooltip 组件支持 ReactNode

- [x] 2.1 修改 `packages/propel/src/tooltip/root.tsx`：在 tooltipContent 为 ReactNode 时不包裹 `<p>` 标签
- [x] 2.2 验证：Tooltip 传入 `<div><span>test</span></div>` 不被 `<p>` 包裹

## 3. 提取 SimpleMarkdown 组件

- [x] 3.1 创建 `apps/web/core/components/issues/extra-properties/simple-markdown.tsx`：从 `description-popover.tsx` 提取 SimpleMarkdown 函数
- [x] 3.2 验证：SimpleMarkdown 能正确渲染粗体、斜体、列表，空行

## 4. 创建 DefaultPropertyTooltip 组件

- [x] 4.1 创建 `apps/web/core/components/issues/extra-properties/default-property-tooltip.tsx`
- [x] 4.2 组件使用 `@plane/propel/tooltip` + `SimpleMarkdown` + Info 图标
- [x] 4.3 支持 `align` prop 控制 tooltip 展开方向
- [x] 4.4 验证：在设置页为 priority 配置 description，详情页显示 ℹ️ 图标

## 5. 统一详情页组件使用 DefaultPropertyTooltip

- [x] 5.1 修改 `apps/web/core/components/issues/issue-detail/sidebar.tsx`：将 `ExtraPropertyDescriptionPopover` 替换为 `DefaultPropertyTooltip`
- [x] 5.2 修改 `apps/web/core/components/issues/issue-detail/main-content.tsx`：同上
- [x] 5.3 修改 `apps/web/core/components/issues/peek-overview/properties.tsx`：同上
- [x] 5.4 修改 `apps/web/core/components/issues/peek-overview/issue-detail.tsx`：同上
- [x] 5.5 验证：各详情页的 ℓ 图标点击后显示 tooltip，Markdown 正确渲染

## 6. 改造 IssueProperties 支持 Kanban/List 视图

- [x] 6.1 修改 `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`
- [x] 6.2 为 priority 属性添加 DefaultPropertyTooltip（当有 description 时）
- [x] 6.3 为 assignee_ids、start_date、target_date、estimate_point、module_ids、cycle_id 等属性同样添加
- [x] 6.4 获取 workspaceSlug（从 useParams）并调用 `useDefaultPropertyConfig`
- [x] 6.5 验证：Kanban/List 视图中，有 description 的属性显示 ℹ️ 图标

## 7. 提交实现代码

- [x] 7.1 提交 Tooltip 组件修改：`#FICC-9999# feat: Tooltip 支持 ReactNode tooltipContent`
- [x] 7.2 提交 SimpleMarkdown 提取：`#FICC-9999# refactor: 提取 SimpleMarkdown 为独立组件`
- [x] 7.3 提交 DefaultPropertyTooltip：`#FICC-9999# feat: 新增 DefaultPropertyTooltip 组件`
- [x] 7.4 提交详情页统一：`#FICC-9999# refactor: 详情页使用 DefaultPropertyTooltip`
- [x] 7.5 提交 IssueProperties 改造：`#FICC-9999# feat: IssueProperties 支持默认属性 description 图标`

## 8. 用户验证

- [x] 8.1 验证 Tooltip ReactNode：在任意设置了 description 的 issue 详情页，点击 ℹ️ 图标确认 tooltip 正确显示
- [x] 8.2 验证 Markdown 渲染：在 description 中输入 `**粗体**` 和 `- 列表`，确认正确渲染
- [x] 8.3 验证 Kanban 视图：打开 Kanban 视图，确认有 description 的属性显示 ℹ️ 图标，点击后 tooltip 正确
- [x] 8.4 验证 List 视图：同上，在 List 视图中验证
- [x] 8.5 验证详情页一致性：sidebar、main-content、peek-overview 的 ℹ️ 图标行为一致
