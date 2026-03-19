# Checkbox Icon Config

## Purpose

为 extra property 的 checkbox 类型提供 true/false 状态的图标+颜色自定义配置，并在紧凑视图中渲染对应图标。

## Requirements

### Requirement: Checkbox 图标配置存储

`ExtraPropertyConfig` 的 `config` JSONField SHALL 支持四个可选的图标配置 key：`true_icon`（lucide icon name）、`true_icon_color`（hex 颜色字符串）、`false_icon`、`false_icon_color`。这四个字段均为可选，不存在时对应状态使用默认图标展示。

#### Scenario: 创建含图标配置的 checkbox 属性

- **WHEN** 用户在配置表单中为 checkbox 属性配置了 true/false 图标
- **THEN** 序列化器 SHALL 将 `true_icon`、`true_icon_color`、`false_icon`、`false_icon_color` 写入 config JSONField
- **AND** 所有四个字段均为可选，未填写时 SHALL 不写入 JSON（不写 null，保持字段不存在）

#### Scenario: 不配置图标时向后兼容

- **WHEN** 已有 checkbox 属性不含图标配置字段
- **THEN** 系统 SHALL 正常运行，前端渲染 SHALL 使用默认 Square/SquareCheck 图标

### Requirement: 图标配置表单 UI

checkbox 类型的属性配置表单 SHALL 在 `true_value`/`false_value` 输入框下方，增加 "True 图标" 和 "False 图标" 两个可选配置项。每项通过 Popover 浮窗触发 `IconColorPicker` 选择图标和颜色。

触发按钮展示规则：

- 已选图标：渲染该 lucide 图标（使用配置的颜色），带 tooltip 显示 icon name
- 未选图标：渲染虚线边框 + 灰色 Plus 图标
- 提供"清除"操作可移除图标配置

#### Scenario: 打开图标选择浮窗

- **WHEN** 用户点击 "True 图标" 或 "False 图标" 的触发按钮
- **THEN** SHALL 弹出包含 `IconColorPicker` 的 Popover
- **AND** Popover SHALL 显示完整的 lucide 图标搜索网格和颜色选择器

#### Scenario: 选择图标后预览

- **WHEN** 用户在 Popover 中选择了图标和颜色后关闭
- **THEN** 触发按钮 SHALL 显示已选图标（带配置颜色）
- **AND** 图标选择结果 SHALL 在提交表单时写入 payload

#### Scenario: 清除图标配置

- **WHEN** 用户点击清除按钮
- **THEN** 该状态（true 或 false）的图标配置 SHALL 被清除
- **AND** 触发按钮 SHALL 恢复为虚线边框 + Plus 图标

### Requirement: 紧凑视图渲染自定义图标

`CompactCheckboxControl` SHALL 根据 config 中的图标配置进行条件渲染：有图标配置时渲染自定义 lucide 图标（带颜色），无图标配置时 fallback 为原有 Square/SquareCheck 图标。

渲染优先级：

1. `isChecked` 且 `config.true_icon` 存在 → 渲染 `config.true_icon`（颜色 `config.true_icon_color ?? "#6b7280"`）
2. `isChecked` 且无 `config.true_icon` → 渲染 `SquareCheck`（`text-accent-primary`）
3. `!isChecked` 且 `config.false_icon` 存在 → 渲染 `config.false_icon`（颜色 `config.false_icon_color ?? "#6b7280"`）
4. `!isChecked` 且无 `config.false_icon` → 渲染 `Square`（`text-tertiary`）

当配置的 icon name 在当前 lucide 版本中不存在时，SHALL fallback 到默认图标（不报错）。

#### Scenario: 渲染自定义 true 图标

- **WHEN** checkbox 值为 true 且 `config.true_icon` 已配置
- **THEN** CompactCheckboxControl SHALL 渲染对应的 lucide 图标
- **AND** 颜色 SHALL 使用 `config.true_icon_color`（无值时使用 `#6b7280`）

#### Scenario: 渲染自定义 false 图标

- **WHEN** checkbox 值为 false 且 `config.false_icon` 已配置
- **THEN** CompactCheckboxControl SHALL 渲染对应的 lucide 图标
- **AND** 颜色 SHALL 使用 `config.false_icon_color`（无值时使用 `#6b7280`）

#### Scenario: 无图标配置时 fallback

- **WHEN** checkbox 无图标配置（旧数据或用户未配置）
- **THEN** CompactCheckboxControl SHALL 分别渲染 SquareCheck（true）和 Square（false）
- **AND** 颜色 SHALL 保持原有样式（text-accent-primary / text-tertiary）

#### Scenario: 图标 name 不存在时 fallback

- **WHEN** config.true_icon 或 config.false_icon 对应的 lucide icon 在当前版本不存在
- **THEN** CompactCheckboxControl SHALL fallback 渲染默认的 SquareCheck 或 Square
- **AND** 不得抛出 JavaScript 错误
