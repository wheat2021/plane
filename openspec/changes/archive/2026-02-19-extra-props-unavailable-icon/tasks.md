## Tasks

### Task 1: 创建属性类型到图标的映射工具函数

**文件**: `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`

**描述**: 在 `WorkItemLayoutAdditionalProperties` 组件中添加一个辅助函数，根据 `config.type` 返回对应的图标组件：

- `text` / `textarea` / `markdown` → `HashPropertyIcon`
- `select` / `multiselect` → `DropdownPropertyIcon`
- `checkbox` → `BooleanPropertyIcon`
- 默认 → `HashPropertyIcon`

**验收标准**:

- [ ] 函数接收 `config.type` 字符串，返回对应的 React 图标组件
- [ ] 覆盖所有已知属性类型

### Task 2: 修改不可用属性的渲染逻辑

**文件**: `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`

**描述**: 将 `!isValid` 分支中的渲染内容从文字标签 (`config.label`) 改为对应类型的灰色图标：

**当前代码** (第 90-106 行):

```tsx
<div className="...opacity-40 cursor-not-allowed bg-layer-2">
  <span className="text-caption-sm-regular text-secondary truncate max-w-20">{config.label}</span>
</div>
```

**目标代码**:

```tsx
<div className="...opacity-40 cursor-not-allowed">
  <PropertyIcon className="h-3 w-3 flex-shrink-0 text-secondary" />
</div>
```

**验收标准**:

- [ ] 不可用属性显示对应类型的图标而非文字
- [ ] 保留 `opacity-40 cursor-not-allowed` 禁用样式
- [ ] 保留 Tooltip 显示属性名称和不可用提示
- [ ] 容器尺寸与可用属性控件一致（h-5）
- [ ] 移除 `bg-layer-2` 背景（仅用图标，无需背景填充）

### Task 3: 清理 console.log 调试语句

**文件**: `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`

**描述**: 移除组件中遗留的 `console.log` 调试输出（第 52 行和第 58-61 行）。

**验收标准**:

- [ ] 所有 `console.log` 语句已移除

### Task 4: 验证视觉效果

**描述**: 在 Board 和 List 布局中验证变更效果。

**验收标准**:

- [ ] List 布局中不可用属性显示为灰色图标
- [ ] Kanban 布局中不可用属性显示为灰色图标
- [ ] 图标类型与属性类型匹配
- [ ] Tooltip 正常显示属性名称和不可用提示
- [ ] 可用属性的渲染不受影响
