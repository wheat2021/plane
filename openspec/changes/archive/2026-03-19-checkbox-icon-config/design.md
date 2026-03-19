## Context

Extra property 的 checkbox 类型在紧凑视图（spreadsheet 列、issue 列表行）中固定显示 `Square`/`SquareCheck` 两个灰色/蓝色图标，无法传达业务语义。现有的 work-item-type 功能已实现了完整的图标+颜色选择能力（`LucideIconPicker` + `IconColorPicker`），可以直接复用。

后端的 `ExtraPropertyConfig.config` 已是 JSONField，无需数据库 migration，只需扩展 JSON 结构即可。

## Goals / Non-Goals

**Goals:**

- 为 checkbox 的 true/false 两个状态分别提供可选的图标（lucide icon name）和颜色（hex）配置
- 紧凑视图中有配置时渲染自定义图标，无配置时 fallback 到原有 Square/SquareCheck
- 配置入口在 extra property 配置表单（Popover 浮窗），与 work-item-type 图标选择体验一致
- 图标 preview 按钮：选中时显示对应图标+颜色，未选时显示虚线边框 + 加号

**Non-Goals:**

- 不修改普通视图（`CheckboxControl` 的 ToggleSwitch + 文字标签）
- 不提供图标预设组合（全量自由选择）
- 不支持图标动画或自定义 SVG
- 不影响 checkbox 的值存储逻辑

## Decisions

### 决策 1：图标配置存储在 config JSONField，不加新数据库字段

**理由**：`config` 已是 JSONField，历史上也用同样方式添加了 `true_extra_input`/`false_extra_input`，保持一致性。无需 migration，后向兼容（旧数据无这几个 key，取不到就用 fallback）。

**备选方案**：加独立数据库字段（`true_icon`, `true_icon_color` 等）—— 过于繁重，JSONField 已足够。

Config 结构扩展：

```json
{
  "true_value": "Yes",
  "false_value": "No",
  "true_icon": "check-circle",
  "true_icon_color": "#22c55e",
  "false_icon": "circle",
  "false_icon_color": "#9ca3af"
}
```

### 决策 2：图标选择通过 Popover 浮窗，复用 IconColorPicker

**理由**：`IconColorPicker` 已封装了图标搜索网格 + 预设颜色 + HEX 输入，配置表单直接包一个 Popover 即可，无需重复实现。

Popover 触发按钮展示逻辑：

- 已选图标：渲染对应 lucide 图标（带颜色），带 tooltip 显示 icon name
- 未选图标：渲染虚线边框 + `Plus` 图标（灰色）
- 可通过 "清除" 按钮将图标置为 null（回退到默认图标）

**备选方案**：折叠展开式 inline 选择器 —— 占用表单垂直空间过多，Popover 更简洁。

### 决策 3：TypeScript 类型用独立字段而非嵌套对象

**理由**：与现有 `true_value`/`false_value` 字段命名模式一致，序列化器展平处理也更统一。避免引入新的嵌套类型增加复杂度。

```typescript
// 扩展后的 TExtraPropertyConfig
true_icon?: string        // lucide icon name
true_icon_color?: string  // hex color
false_icon?: string
false_icon_color?: string
```

### 决策 4：紧凑视图渲染优先级

有 `true_icon`/`false_icon` 配置时优先渲染自定义图标，否则 fallback：

```
isChecked && config.true_icon  → 自定义图标（config.true_icon_color 为颜色）
isChecked && !config.true_icon → SquareCheck（原有默认，accent-primary 色）
!isChecked && config.false_icon → 自定义图标
!isChecked && !config.false_icon → Square（原有默认，tertiary 色）
```

## Risks / Trade-offs

- [JSONField 无 schema 约束] → 序列化器做字段验证（icon name 格式、color hex 格式）；前端 `LucideIconPicker` 输出的都是合法 icon name
- [Lucide 版本升级导致图标不存在] → 渲染时做 fallback（icon 不存在时降级到 Square/SquareCheck），不显示空白或报错
- [颜色字段未填写时的展示] → `true_icon_color` 为空时使用默认颜色 `#6b7280`（与 `LucideIconPicker` 的默认颜色一致）

## Migration Plan

1. 后端序列化器新增四个可选字段（读写均可选，已有数据不受影响）
2. 前端类型扩展（可选字段，不影响现有渲染）
3. 配置表单新增图标选择区域
4. 紧凑视图加条件渲染

无需数据库 migration，无需强制用户重新配置，完全向后兼容。

## Open Questions

无。
