## Why

当前 `ExtraPropertyDescriptionPopover` 是自定义实现的弹出提示组件，存在以下问题：

1. 硬编码样式，与系统 `@plane/propel/tooltip` 组件不一致
2. 自定义 `useState` + `useEffect` 做点击外部关闭，重复造轮子
3. 不支持系统 Tooltip 的高级特性（如 `sideOffset`、`align`）
4. Kanban/List 视图的 `IssueProperties` 组件没有展示默认属性的 description

## What Changes

1. **修改 `@plane/propel/tooltip` 根组件**：支持 `tooltipContent` 为 `ReactNode` 时不被 `<p>` 包裹
2. **创建 `DefaultPropertyTooltip` 组件**：统一使用系统 Tooltip + SimpleMarkdown + Info 图标
3. **改造 `IssueProperties` 组件**：为有 description 的默认属性添加 info 图标（Kanban/List 视图）
4. **统一详情页组件**：将 `sidebar.tsx`、`main-content.tsx`、`peek-overview` 中的 `ExtraPropertyDescriptionPopover` 替换为 `DefaultPropertyTooltip`
5. **保留 `ExtraPropertyDescriptionPopover`**：继续给 extra properties 使用（它们有后端存储的 `config.description`）

**不修改 Spreadsheet 视图**（保持现状，不添加 description tooltip）

## Capabilities

### New Capabilities

- `default-property-tooltip`：统一的默认属性 description tooltip 组件，复用系统 Tooltip 机制，支持 Markdown 渲染

### Modified Capabilities

- `default-property-description`：扩展 spec，明确 Kanban/List 视图的 description 展示机制

## Impact

**修改的文件**：

- `packages/propel/src/tooltip/root.tsx` - Tooltip 组件改造
- `apps/web/core/components/issues/extra-properties/default-property-tooltip.tsx` - 新建
- `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx` - IssueProperties 改造
- `apps/web/core/components/issues/issue-detail/sidebar.tsx` - 替换 popover
- `apps/web/core/components/issues/issue-detail/main-content.tsx` - 替换 popover
- `apps/web/core/components/issues/peek-overview/properties.tsx` - 替换 popover
- `apps/web/core/components/issues/peek-overview/issue-detail.tsx` - 替换 popover

**上游风险**：中等 - `tooltip/root.tsx` 是共享组件，修改时需注意向后兼容
