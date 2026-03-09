## Context

Extra Properties 功能允许工作区管理员为工作项定义自定义属性。当前实现中存在以下问题：

1. 描述字段（`TextArea` 组件）使用了 `react-hook-form` 的 `register` 非受控模式，但 `@plane/ui` 的 `TextArea` 组件未能正确转发 ref，导致字段无法输入
2. Markdown 类型引入了 TipTap 富文本编辑器依赖，与 textarea 功能重叠，维护成本高
3. Select/Multi-Select 选项的第二列语义模糊（"标签"容易理解为显示名称而非注释），且选中后无法查看对应注释

本次变更均为纯前端改动，不涉及后端 API 或数据库变更。

## Goals / Non-Goals

**Goals:**

- 修复描述字段无法输入的 bug
- 移除 markdown 属性类型
- 在 Select/Multi-Select 控件中内联展示选项注释

**Non-Goals:**

- 不修改后端 API 或数据库结构
- 不修改 `option.label` 字段名（仅改 UI 显示文字）
- 不处理类型迁移逻辑（本次变更不允许编辑时修改类型，见 proposal 第4项为单独变更）

## Decisions

### 1. 描述字段：改用 Controller 受控模式

**决策**：将 `form.tsx` 中的描述字段从 `<TextArea {...register("description")}>` 改为 `<Controller name="description" control={control} render={({ field }) => <TextArea {...field} />}>` 。

**理由**：`register` 依赖 ref 转发实现非受控读值，`@plane/ui` 的 `TextArea` 未正确转发 ref。改用 `Controller` 后 react-hook-form 通过 `onChange`/`value` 管理状态，绕过 ref 问题，与项目中其他 `CustomSelect` 字段的处理方式一致。

**替代方案**：改用原生 `<textarea>` —— 否决，破坏视觉一致性。

### 2. Markdown 类型：直接删除

**决策**：直接删除 `"markdown"` 类型及相关代码，无需迁移脚本。

**理由**：线上确认无存量 markdown 类型属性，删除成本为零。

**涉及文件**：

- `packages/types/src/extra-property.ts`：联合类型删除 `"markdown"`
- `form.tsx`：PROPERTY_TYPES 数组删除 markdown 项
- `item.tsx`：TYPE_LABELS 删除 markdown 项
- `extra-property-control.tsx`：删除 case 及 import
- `controls/markdown.tsx`：整体删除
- `extra-property-renderer.tsx`：`getPropertyIcon` 的 markdown case 删除

### 3. 注释显示：内联文字，不改数据字段

**决策**：保留后端字段名 `option.label`，仅改 UI 展示逻辑：在选中值和下拉项旁以浅色文字内联显示注释。

**UI 规范**：

```
已选中状态：
  值A · 这是注释          ← 注释用 text-custom-text-300 和 "·" 分隔

下拉列表项：
  ┌─────────────────────────────────────┐
  │  值A  · 这是注释                    │  ← 注释 text-custom-text-300
  └─────────────────────────────────────┘
```

**分隔符**：注释非空时显示 `·`（`·` U+00B7），注释为空时不显示分隔符。

**摘要显示**（Multi-Select 已选摘要）：仅显示值，不显示注释，避免摘要过长。

**搜索**：`queryArray` 保留 `["label", "value"]`，注释参与搜索匹配（`label` 字段即注释）。

**替代方案**：Tooltip 悬停 —— 否决，用户明确选择内联方式。

## Risks / Trade-offs

- **注释文字过长导致溢出**：选中值的注释显示区域有限，过长注释需 `truncate`；下拉列表宽度通常充足，可接受换行或截断
  → 缓解：对注释文字加 `truncate` 或 `max-w` 限制，保证布局稳定

## Migration Plan

无需数据库迁移。前端代码修改后直接部署生效。

markdown 类型删除属于破坏性变更（BREAKING），但线上无存量数据，无需回滚策略。
