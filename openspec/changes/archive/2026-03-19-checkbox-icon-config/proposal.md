## Why

Extra property 的 checkbox 类型在紧凑视图（spreadsheet 列、侧边栏图标区）中固定使用 `Square`/`SquareCheck` 两个 lucide 图标，无法体现业务语义（如用绿色 check-circle 表示"已完成"、红色 x-circle 表示"被阻塞"）。为 true/false 两个状态提供自定义图标+颜色配置，可以让 checkbox 的含义在视觉上更加直观，降低阅读成本。

## What Changes

- **配置表单**：checkbox 类型的属性配置表单中，新增 "True 图标" 和 "False 图标" 两个可选图标+颜色选择器（通过 Popover 浮窗触发，复用 `IconColorPicker`）
- **数据模型**：`ExtraPropertyConfig` 的 `config` JSONField 新增四个可选 key：`true_icon`、`true_icon_color`、`false_icon`、`false_icon_color`
- **前端类型**：`TExtraPropertyConfig` 新增四个可选字段对应上述 JSON key
- **序列化器**：后端序列化/反序列化新增四个字段
- **紧凑视图渲染**：`CompactCheckboxControl` 当有图标配置时渲染自定义 lucide 图标（带颜色），无配置时 fallback 为原有的 `Square`/`SquareCheck`
- **普通视图不变**：`CheckboxControl`（ToggleSwitch + 文本）保持原样

## Capabilities

### New Capabilities

- `checkbox-icon-config`：为 extra property 的 checkbox 类型提供 true/false 状态的图标+颜色自定义配置能力，以及在紧凑视图中的对应渲染

### Modified Capabilities

- `extra-properties`：`ExtraPropertyConfig` 的 `config` JSON 结构扩展，增加 checkbox 图标配置字段；`TExtraPropertyConfig` 类型扩展

## Impact

**后端**

- `apps/api/plane/db/models/extra_property.py`：新增 `true_icon`、`false_icon` 等属性（读取 config JSON）
- `apps/api/plane/api/serializers/`：序列化器扩展

**前端**

- `packages/types/src/extra-property.ts`：类型扩展
- `apps/web/core/components/workspace/settings/extra-properties/form.tsx`：图标选择 Popover
- `apps/web/core/components/issues/extra-properties/compact-controls/compact-checkbox.tsx`：条件渲染自定义图标

**上游冲突风险**

- `compact-checkbox.tsx`：本地新增文件，无上游冲突风险
- `form.tsx`：本地新增文件，无上游冲突风险
- `extra-property.ts`：本地扩展类型，低冲突风险
- `extra_property.py`：本地新增模型，低冲突风险
