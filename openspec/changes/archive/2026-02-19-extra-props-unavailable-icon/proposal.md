## Why

当前 Board 和 List 布局中，不可用的 extra properties（工作项类型未绑定的属性）以灰色文字标签形式展示（显示属性名称）。而可用属性在这些布局中显示为带图标的紧凑控件（如 `HashPropertyIcon`、`DropdownPropertyIcon`、`BooleanPropertyIcon`）。这导致了视觉风格不统一——可用属性有图标，不可用属性却只有文字。需要将不可用属性改为使用对应类型的灰色图标来替代文字标签，以保持界面一致性。

## What Changes

- 在 Board（Kanban）和 List 布局中，不可用的 extra properties 从显示灰色属性名称文字改为显示对应类型的灰色图标
- 根据属性类型（text/select/checkbox）选择对应的图标（HashPropertyIcon/DropdownPropertyIcon/BooleanPropertyIcon）
- 保留现有的 `opacity-40 cursor-not-allowed` 禁用视觉样式
- 保留 Tooltip 悬停提示 "此属性对当前工作项类型不可用"
- Spreadsheet 布局不在本次变更范围内（其使用 "—" 占位符，属于表格惯例）

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `extra-properties-display`: 修改 List 和 Kanban 布局中不可用属性的渲染方式，从文字标签改为类型化图标

## Impact

- **前端代码**: 仅修改 `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx` 中的不可用属性渲染逻辑
- **上游冲突风险**: 低。该文件为 `ce/` 目录下的自定义组件，不太可能与上游冲突
- **API/后端**: 无影响
- **依赖**: 复用已有的 `@plane/propel/icons` 中的属性图标组件，无需新增依赖
