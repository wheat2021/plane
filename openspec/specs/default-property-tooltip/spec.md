# Default Property Tooltip

## Purpose

定义统一的 `DefaultPropertyTooltip` 组件，用于展示默认属性的自定义 description。该组件复用系统 `@plane/propel/tooltip` 机制，支持 Markdown 渲染。

## Requirements

### Requirement: DefaultPropertyTooltip 组件接口

DefaultPropertyTooltip SHALL 提供以下接口：

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

---

### Requirement: Tooltip 组件 ReactNode 支持

`@plane/propel/tooltip` 组件 SHALL 支持 `tooltipContent` 为 ReactNode 类型时不包裹 `<p>` 标签。

#### Scenario: 字符串 tooltipContent 行为不变

- **WHEN** tooltipContent 为字符串
- **THEN** 组件 SHALL 将其包裹在 `<p className="...">` 中
- **AND** 样式 SHALL 为 `text-caption-sm-regular text-secondary`

#### Scenario: ReactNode tooltipContent 直接渲染

- **WHEN** tooltipContent 为 ReactNode（如 SimpleMarkdown 组件）
- **THEN** 组件 SHALL 将其包裹在 `<div>` 中（而非 `<p>`）
- **AND** 容器 SHALL 应用与 heading 的间距样式（`mt-1` 如果有 heading）

---

### Requirement: SimpleMarkdown 组件

SimpleMarkdown SHALL 支持以下 Markdown 语法：

#### Scenario: 粗体渲染

- **WHEN** 文本包含 `**粗体**`
- **THEN** 渲染为 `<strong>粗体</strong>`

#### Scenario: 斜体渲染

- **WHEN** 文本包含 `*斜体*` 或 `_斜体_`
- **THEN** 渲染为 `<em>斜体</em>`

#### Scenario: 无序列表渲染

- **WHEN** 文本包含 `- 列表项` 或 `* 列表项`
- **THEN** 渲染为 `<div className="flex gap-1.5"><span>•</span><span>内容</span></div>`

#### Scenario: 空行作为段落分隔

- **WHEN** 文本包含空行
- **THEN** 空行 SHALL 渲染为 `<div className="h-1.5"></div>`

---

### ~~Requirement: ExtraPropertyDescriptionPopover 组件~~ (REMOVED)

> **已移除**：被 `DefaultPropertyTooltip` 完全替代。旧组件使用 click-to-toggle 手动状态管理，新组件使用 Radix Tooltip（hover 触发）；新组件与设计系统一致，代码量更少，交互更自然。
>
> **Migration**:
>
> - `apps/web/core/components/issues/issue-modal/form.tsx`：`formPropAppend` 中的 `ExtraPropertyDescriptionPopover` → `DefaultPropertyTooltip`
> - `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`：`ExtraPropertyDescriptionPopover` → `DefaultPropertyTooltip`
> - `apps/web/core/components/issues/extra-properties/description-popover.tsx`：文件删除
