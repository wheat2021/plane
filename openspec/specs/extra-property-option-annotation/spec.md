## Purpose

Defines requirements for inline annotation display in Select and Multi-Select extra property controls. Annotations are stored in `option.label` and displayed alongside option values in the settings editor, selected value display, and dropdown list.

## Requirements

### Requirement: Select 选项内联注释显示

Select 和 Multi-Select 类型的属性选项 SHALL 支持注释字段（存储于 `option.label`）。注释字段 SHALL 在以下位置内联显示：

1. 设置表单的选项编辑区：第二列输入框标题改为"注释"
2. 控件已选中值旁：以浅色文字内联展示注释（如有）
3. 下拉列表每个选项旁：以浅色文字内联展示注释（如有）

注释为可选项，若为空则仅显示值本身，布局不变。

#### Scenario: 设置表单选项编辑器显示"注释"列

- **WHEN** 管理员选择 select 或 multiselect 类型并进入选项编辑区
- **THEN** 第二列输入框的占位符/标签文字 SHALL 显示"注释"而非"标签"

#### Scenario: 选中值旁内联显示注释

- **WHEN** 用户为 select 类型属性选中一个值（如"值A"，对应注释"这是注释"）
- **THEN** 控件 SHALL 显示 `值A · 这是注释`，注释以浅色文字紧跟在值右侧

#### Scenario: 注释为空时不显示分隔符

- **WHEN** 用户选中一个没有注释的选项
- **THEN** 控件 SHALL 仅显示值本身，不显示分隔符"·"和空白

#### Scenario: 下拉列表内联显示注释

- **WHEN** 用户打开 select 或 multiselect 的下拉列表
- **THEN** 每个选项 SHALL 在其值右侧以浅色文字显示注释（若存在）

#### Scenario: Multi-Select 选中摘要

- **WHEN** 用户在 multiselect 中选择了 1-2 个带注释的选项
- **THEN** 控件摘要 SHALL 仅显示选中值（不含注释），以逗号分隔

#### Scenario: 注释不参与搜索过滤

- **WHEN** 用户在下拉搜索框中输入文字
- **THEN** 系统 SHALL 同时匹配选项的值和注释文字
