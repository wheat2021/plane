## MODIFIED Requirements

### Requirement: DefaultPropertyTooltip 组件接口

DefaultPropertyTooltip SHALL 提供以下接口（与上一版本一致，无变化）：

```tsx
type Props = {
  description: string;
  align?: "left" | "right";
};
```

#### Scenario: 基本渲染

- **WHEN** 组件接收到非空 description
- **THEN** 组件 SHALL 显示一个 Info 图标（`size-3.5`，颜色 `text-custom-text-400`）
- **AND** 图标 SHALL 在 hover 时变为 `text-custom-text-300`

#### Scenario: hover 显示 tooltip

- **WHEN** 用户 hover Info 图标
- **THEN** 系统 SHALL 显示 tooltip，tooltipContent 为 `<SimpleMarkdown text={description} />` 渲染结果

#### Scenario: align 为 right 时 tooltip 向左展开

- **WHEN** align prop 为 "right"
- **THEN** tooltip SHALL 向左展开（position 为 "right"）
- **WHEN** align prop 为 "left" 或未指定
- **THEN** tooltip SHALL 向右展开（position 为 "left"）

#### Scenario: sideOffset 为 8

- **WHEN** tooltip 展开时
- **THEN** tooltip 与触发元素的间距 SHALL 为 8px

## REMOVED Requirements

### Requirement: ExtraPropertyDescriptionPopover 组件

**Reason**: 被 `DefaultPropertyTooltip` 完全替代。旧组件使用 click-to-toggle 手动状态管理，新组件使用 Radix Tooltip（hover 触发）；新组件与设计系统一致，代码量更少，交互更自然。

**Migration**:

- `apps/web/core/components/issues/issue-modal/form.tsx`：`formPropAppend` 中的 `ExtraPropertyDescriptionPopover` → `DefaultPropertyTooltip`
- `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`：`ExtraPropertyDescriptionPopover` → `DefaultPropertyTooltip`
- `apps/web/core/components/issues/extra-properties/description-popover.tsx`：文件删除

#### Scenario: 迁移后行为一致

- **WHEN** `ExtraPropertyDescriptionPopover` 被替换为 `DefaultPropertyTooltip` 后
- **THEN** ℹ️ 图标 SHALL 在 hover 时（而非 click）展示 tooltip 内容
- **AND** description 的 Markdown 渲染 SHALL 保持一致
