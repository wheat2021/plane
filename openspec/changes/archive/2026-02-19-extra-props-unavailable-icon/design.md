## Context

当前在 `WorkItemLayoutAdditionalProperties` 组件（`ce/components/issues/issue-layouts/additional-properties.tsx`）中，不可用的 extra properties 渲染为带边框的灰色文字标签（显示 `config.label`）。而可用的属性通过 `CompactExtraPropertyControl` 渲染，每种类型都有对应的图标：

- text/textarea/markdown → `HashPropertyIcon`
- select/multiselect → `DropdownPropertyIcon`
- checkbox → `BooleanPropertyIcon`

这造成了可用属性和不可用属性在视觉上的风格不一致。

## Goals / Non-Goals

**Goals:**

- 不可用属性使用与可用属性相同类型的图标（灰色、禁用样式）
- 保持界面视觉一致性

**Non-Goals:**

- 不改变 Spreadsheet 布局的不可用属性展示（"—" 是表格惯例）
- 不改变属性的可用性判断逻辑
- 不改变 Tooltip 提示内容

## Decisions

### Decision 1: 根据属性类型选择对应图标

**选择**: 根据 `config.type` 字段映射到对应的属性图标组件

**理由**: 可用属性的紧凑控件已经使用了这个映射关系，不可用属性使用相同的图标可以保持视觉一致性。

**映射关系**:
| config.type | 图标组件 |
|---|---|
| text, textarea, markdown | HashPropertyIcon |
| select, multiselect | DropdownPropertyIcon |
| checkbox | BooleanPropertyIcon |

**备选方案**: 使用统一的 "禁用" 图标（如斜线圆形）。但这样无法传达属性类型信息，且与可用状态的视觉差异仍然较大。

### Decision 2: 仅显示图标，不显示文字标签

**选择**: 不可用属性只显示图标，不再显示 `config.label` 文字

**理由**:

- 可用属性的紧凑控件中也以图标为主要视觉元素
- 不可用属性不需要用户交互，显示名称的必要性低
- Tooltip 已提供属性名称和不可用提示
- 仅图标使界面更简洁

### Decision 3: 复用现有的样式方案

**选择**: 保持 `opacity-40 cursor-not-allowed` 样式，容器尺寸与可用属性控件保持一致（h-5）

**理由**: 现有的禁用视觉效果已经足够明确，只需将内容从文字改为图标。

## Risks / Trade-offs

- **[图标语义不够直观]** → 用户可能无法仅通过灰色图标识别具体属性。通过 Tooltip 显示属性名称和不可用提示来缓解。
- **[上游冲突]** → 低风险。修改的文件在 `ce/` 目录下，是自定义组件。

## Open Questions

（无）
