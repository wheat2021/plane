## 1. 提交变更文档

- [x] 1.1 提交本次变更的 openspec 文档（proposal、design、specs）

## 2. 删除 Markdown 类型

- [x] 2.1 `packages/types/src/extra-property.ts`：`TExtraPropertyType` 联合类型中删除 `"markdown"`
- [x] 2.2 `form.tsx`：`PROPERTY_TYPES` 数组删除 markdown 项
- [x] 2.3 `item.tsx`：`TYPE_LABELS` 删除 markdown 项
- [x] 2.4 `extra-property-control.tsx`：删除 `case "markdown"` 分支及 `MarkdownControl` import
- [x] 2.5 `extra-property-renderer.tsx`：`getPropertyIcon` 中删除 markdown case
- [x] 2.6 删除文件 `controls/markdown.tsx`

## 3. 修复描述字段输入问题

- [x] 3.1 `form.tsx`：将描述字段从 `register("description")` 改为 `Controller` 受控模式（参考同文件中 type 字段的 Controller 用法）

## 4. Select/Multi-Select 注释内联显示

- [x] 4.1 `form.tsx`：将选项编辑区第二列的 placeholder/label 文字从"标签"改为"注释"（i18n key: `form.option_label` → 改为 `form.option_annotation`，或直接更新翻译文本）
- [x] 4.2 `controls/select.tsx`：已选中值的 `buttonContent` 中，若 `option.label` 非空则内联显示注释（格式：`值 · 注释`，注释使用 `text-custom-text-300`）
- [x] 4.3 `controls/select.tsx`：`renderItem` 中在选项值右侧内联显示注释（注释为空时不显示分隔符）
- [x] 4.4 `controls/multi-select.tsx`：`renderItem` 中同样内联显示注释（与 select 保持一致）
- [x] 4.5 `controls/multi-select.tsx`：`buttonContent` 摘要仅显示值，不含注释

## 5. 更新 i18n 翻译

- [x] 5.1 检查并更新 `option_label` 相关的翻译 key，将"标签"改为"注释"（中英文翻译文件）

## 6. 提交实现代码

- [x] 6.1 按功能分组提交：`#FICC-9999# fix: 修复 extra properties 描述字段无法输入`
- [x] 6.2 提交：`#FICC-9999# feat: 删除 extra properties markdown 类型`
- [x] 6.3 提交：`#FICC-9999# feat: Select/Multi-Select 选项支持注释内联显示`

## 7. 用户验证

- [ ] 7.1 **验证描述字段**：在工作区设置 > Extra Properties 中创建新属性，点击描述输入栏并输入文字，确认可以正常输入和保存
- [ ] 7.2 **验证 markdown 已删除**：新建属性时打开类型下拉框，确认"Markdown"不再出现
- [ ] 7.3 **验证注释输入**：创建 select 类型属性，在选项编辑区确认第二列标题/placeholder 显示"注释"
- [ ] 7.4 **验证注释显示**：为 select 属性选项填写注释，在工作项侧边栏选择该属性值，确认所选值右侧内联显示注释
- [ ] 7.5 **验证下拉注释**：打开 select 属性的下拉列表，确认每个选项旁边显示对应注释
- [ ] 7.6 **验证无注释时**：对没有填写注释的选项，确认不显示"·"分隔符
