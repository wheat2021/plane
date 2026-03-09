## Why

Extra Properties 功能在实际使用中发现三个缺陷：描述字段因组件兼容性问题无法输入内容；Markdown 类型超出当前需求范围且维护成本高；Select/Multi-Select 的选项"标签"概念与显示名称容易混淆，改为"注释"语义更准确，并在 UI 中内联展示注释提升可读性。

## What Changes

- **修复**：描述字段（TextArea）与 react-hook-form `register` 的兼容性问题，改用 `Controller` 受控模式，使用户能正常输入描述内容
- **删除**：`markdown` 属性类型，从类型定义、表单选项、渲染器、控件文件全部移除；无需数据迁移（线上无存量 markdown 类型属性）**BREAKING**
- **改进**：Select/Multi-Select 选项的第二列从"标签（label）"改为"注释"语义；后端字段名 `label` 保持不变，仅改 UI 表现——在已选中值右侧内联显示注释文字，下拉列表中每个选项也在值旁边内联展示注释

## Capabilities

### New Capabilities

- `extra-property-option-annotation`：Select/Multi-Select 选项注释内联展示——表单输入第二列改称"注释"，选中值后在右侧浅色文字内联显示对应注释，下拉列表中也同步展示

### Modified Capabilities

- `extra-properties`：移除 markdown 类型支持；修复描述字段输入问题

## Impact

- `packages/types/src/extra-property.ts`：`TExtraPropertyType` 删除 `"markdown"`
- `apps/web/core/components/workspace/settings/extra-properties/form.tsx`
  - 描述字段改用 `Controller` 受控模式
  - 删除 PROPERTY_TYPES 中的 markdown 选项
  - 选项表格第二列 placeholder/label 改为"注释"
- `apps/web/core/components/workspace/settings/extra-properties/item.tsx`：TYPE_LABELS 删除 markdown
- `apps/web/core/components/issues/extra-properties/extra-property-control.tsx`：删除 markdown case 及 import
- `apps/web/core/components/issues/extra-properties/controls/markdown.tsx`：删除文件
- `apps/web/core/components/issues/extra-properties/controls/select.tsx`：选中值旁内联显示注释；下拉项展示注释
- `apps/web/core/components/issues/extra-properties/controls/multi-select.tsx`：同上
- i18n 相关翻译键（如有 markdown 相关 key 需清理）

上游冲突风险：**低**（均为自定义新增文件，与上游无交叉）
