## Why

Select 和 Checkbox 类型的 extra property 目前只能记录用户的选择，无法根据选择结果动态引入额外的输入字段。实际业务中，某些选项需要补充信息（如选择"其他"时需要填写具体内容，选择"是"时需要填写原因）。当前只能将所有可能的补充字段都作为普通属性绑定，导致表单臃肿、用户困惑。

## What Changes

- 在 workspace 级别的 ExtraPropertyConfig 中，为 select/multiselect 的每个 option 和 checkbox 的 true/false 状态增加 `extra_input` 配置，可关联另一个已有的 ExtraPropertyConfig
- 当 project 的 issue type 绑定了含 extra_input 的属性时，系统自动创建关联属性的 condition binding（标记 `condition_config` 指向父属性），默认排在父属性下方
- Workspace config 的 extra_input 变更时，自动同步到所有已绑定的 project+issueType
- 解绑父属性时级联删除其 condition bindings
- Condition binding 不可手动解绑，生命周期完全由父属性控制
- Issue detail sidebar（创建/编辑视图）：condition property 仅在父属性当前值匹配触发选项时显示并可编辑
- List/Kanban/Spreadsheet layout：condition property 根据父属性值条件可编辑，不匹配时显示灰色占位（保持列对齐）
- Condition property 遵循 display properties 选择器、filter、排序控制
- 支持嵌套链（A→B→C），保存时检测循环引用并拒绝
- 父选项切换时保留 condition property 的已有值（不清空）
- extra_input 配置中可指定 condition property 的 is_required 状态

## Capabilities

### New Capabilities

- `condition-extra-properties`: 定义 extra input 配置模型、自动 condition binding 创建/同步/删除、循环检测、sidebar 条件渲染、list layout 条件可编辑逻辑

### Modified Capabilities

- `extra-properties`: ExtraPropertyConfig 的 option 结构增加 extra_input 字段，checkbox config 增加 true_extra_input/false_extra_input
- `project-extra-property-binding`: IssueTypeExtraProperty 增加 condition_config 字段，绑定/解绑时自动管理 condition bindings
- `extra-properties-display`: List/Kanban/Spreadsheet layout 中 condition property 的条件可编辑渲染逻辑
- `extra-property-settings`: Workspace 设置表单中 select/checkbox 选项的 extra input 配置 UI
- `extra-property-filter`: Condition property 作为筛选维度的支持

## Impact

- **后端模型**: ExtraPropertyConfig.config JSON 结构扩展；IssueTypeExtraProperty 新增 condition_config FK 字段（需数据库迁移）
- **后端 API**: 绑定创建/删除 API 增加自动 condition binding 管理逻辑；ExtraPropertyConfig 更新 API 增加 extra_input 变更同步逻辑
- **前端类型**: TExtraPropertyOption 增加 extra_input 字段；TIssueTypeExtraProperty 增加 condition_config 字段
- **前端 Store**: IssueTypeExtraProperty store 需处理 condition binding 的自动刷新
- **前端组件**: issue detail sidebar、list/kanban/spreadsheet layout 的 extra property 渲染组件需增加条件判断逻辑
- **前端设置**: extra property form 的选项编辑器需增加 extra input 选择器
- **上游冲突风险**: 低——改动集中在自定义的 extra property 系统，不涉及上游核心文件
