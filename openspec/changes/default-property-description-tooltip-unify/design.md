## Context

当前 `ExtraPropertyDescriptionPopover` 组件是 2026-03-19 default-property-description 变更中创建的自定义弹出提示实现。该组件：

1. 使用自定义 `useState` + `useEffect` 处理点击外部关闭
2. 硬编码样式（`w-80 rounded-md border...`），与系统 Tooltip 不一致
3. 使用内联 `SimpleMarkdown` 组件渲染 Markdown
4. 只在详情页（sidebar、main-content、peek-overview、issue-modal）使用

**问题**：

- Kanban/List 视图的 `IssueProperties` 组件没有展示默认属性的 description
- `ExtraPropertyDescriptionPopover` 与系统 `@plane/propel/tooltip` 机制不统一

## Goals / Non-Goals

**Goals:**

- 统一默认属性 description tooltip 机制，复用系统 `@plane/propel/tooltip`
- 在 Kanban/List 视图的 `IssueProperties` 中展示默认属性 description
- 保持与 extra properties 现有行为的一致性

**Non-Goals:**

- 不修改 Spreadsheet 视图
- 不改变 extra properties 的 `ExtraPropertyDescriptionPopover` 使用方式
- 不涉及后端 API 变更（纯前端改造）

## Decisions

### 决策 1：修改 `@plane/propel/tooltip` 支持 ReactNode content

**选择**：在 `tooltipContent` 为 ReactNode 时不包裹 `<p>` 标签

**代码改动**：

```tsx
// packages/propel/src/tooltip/root.tsx line 65-73
{
  tooltipContent &&
    (typeof tooltipContent === "string" ? (
      <p className="...">{tooltipContent}</p>
    ) : (
      <div className={cn({ "mt-1": tooltipHeading })}>{tooltipContent}</div>
    ));
}
```

**理由**：SimpleMarkdown 返回 `<div>` 结构，被 `<p>` 包裹会导致 HTML 语义错误（`<p>` 内不能有 `<div>`）

**备选**：使用 `tooltipHeading` 传内容 - 样式不匹配（heading 是 `text-caption-md-medium`）

---

### 决策 2：创建 `DefaultPropertyTooltip` 组件

**选择**：新建 `DefaultPropertyTooltip` 组件，内部复用 Tooltip + SimpleMarkdown

**文件位置**：`apps/web/core/components/issues/extra-properties/default-property-tooltip.tsx`

**接口**：

```tsx
type Props = {
  description: string;
  align?: "left" | "right";
};
```

**实现**：

```tsx
export function DefaultPropertyTooltip({ description, align = "left" }: Props) {
  return (
    <Tooltip
      tooltipContent={<SimpleMarkdown text={description} />}
      position={align === "right" ? "right" : "left"}
      sideOffset={8}
    >
      <Info className="size-3.5 text-custom-text-400 hover:text-custom-text-300 transition-colors" />
    </Tooltip>
  );
}
```

**理由**：封装统一的 Info 图标 + tooltip 逻辑，避免在每个使用点重复代码

---

### 决策 3：保留 `ExtraPropertyDescriptionPopover` 给 extra properties

**选择**：不替换 `ExtraPropertyRenderer` 中的 `ExtraPropertyDescriptionPopover`

**理由**：

- Extra properties 的 description 来自后端 `config.description`
- 它们的渲染逻辑与 default properties 不同（直接在配置中）
- 改动范围太大，风险高

---

### 决策 4：Kanban/List 视图在 IssueProperties 中添加 info 图标

**选择**：在 `IssueProperties` 中，为每个有 description 的默认属性在 dropdown 后添加 `<DefaultPropertyTooltip>`

**实现方式**：

```tsx
// IssueProperties 中的 priority 部分
<WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
  <div className="h-5 flex items-center gap-1" ...>
    <PriorityDropdown ... />
    {priorityDescription && <DefaultPropertyTooltip description={priorityDescription} />}
  </div>
</WithDisplayPropertiesHOC>
```

**理由**：Kanban/List 使用统一的 `IssueProperties` 组件，比 Spreadsheet 的独立列组件更容易统一处理

---

### 决策 5：提取 `SimpleMarkdown` 为独立组件

**选择**：将 `ExtraPropertyDescriptionPopover` 中的 `SimpleMarkdown` 提取为独立组件

**文件位置**：`apps/web/core/components/issues/extra-properties/simple-markdown.tsx`

**理由**：`DefaultPropertyTooltip` 和 `ExtraPropertyDescriptionPopover` 都需要渲染 Markdown，提取公共组件避免重复

## Risks / Trade-offs

- **上游同步风险**：修改 `packages/propel/src/tooltip/root.tsx` 是共享组件，可能与上游更新冲突
  - ** Mitigation**：改动最小化，只在 ReactNode 时改变包裹方式，字符串行为不变
- **Kanban/List 性能**：每个 IssueProperties 实例都会获取 description，可能增加 MobX store 调用
  - ** Mitigation**：`getDescription` 是 computedFn，性能开销小
