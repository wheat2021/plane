## 1. 后端模型与迁移

- [ ] 1.1 ExtraPropertyConfig.config JSON 结构扩展：在序列化器中支持 option.extra_input（含 config UUID 和 required）以及 checkbox 的 true_extra_input/false_extra_input 字段的验证（引用必须存在于同一 workspace）
- [ ] 1.2 IssueTypeExtraProperty 模型新增 condition_config FK 字段（nullable，指向 ExtraPropertyConfig，on_delete=CASCADE），创建数据库迁移
- [ ] 1.3 后端循环引用检测：在 ExtraPropertyConfig 更新 API 中，保存前构建有向图（config → extra_input.config），DFS 检测环，发现环时返回 HTTP 400

## 2. 后端 Condition Binding 自动管理

- [ ] 2.1 实现 condition binding 自动创建逻辑：绑定父属性时递归检查所有 option 的 extra_input，自动创建 condition binding（设置 condition_config、is_required、sort_order）
- [ ] 2.2 实现 workspace config 变更时的 condition binding 同步：ExtraPropertyConfig 更新 API 中 diff 新旧 extra_input，对所有已绑定的 project+issueType 创建新增的 / 删除移除的 / 更新 is_required 变更的 condition binding
- [ ] 2.3 实现解绑父属性时级联删除 condition binding（递归删除嵌套链）
- [ ] 2.4 Delete binding API 拒绝手动删除 condition binding（condition_config 不为 null 时返回 HTTP 400）
- [ ] 2.5 Update binding API 限制 condition binding 只能更新 sort_order，拒绝更新 is_required
- [ ] 2.6 Binding list API 响应中包含 condition_config 字段

## 3. 前端类型与 Service

- [ ] 3.1 TExtraPropertyOption 类型增加 extra_input 字段：`extra_input?: { config: string; required?: boolean } | null`
- [ ] 3.2 TExtraPropertyConfig 类型增加 true_extra_input/false_extra_input 字段
- [ ] 3.3 TIssueTypeExtraProperty 类型增加 condition_config 字段：`condition_config: string | null`
- [ ] 3.4 ExtraPropertyConfigService 的 create/update payload 支持 options 中的 extra_input 字段

## 4. 前端 Store

- [ ] 4.1 ExtraPropertyConfig store 新增 helper 方法：getExtraInputConfigs(configId) 返回所有 extra_input 关联的 config ID 集合；getTriggerValues(parentConfigId, childConfigId) 返回触发选项值集合
- [ ] 4.2 IssueTypeExtraProperty store 新增方法：isConditionBinding(bindingId)；isConditionMet(projectId, issueTypeId, bindingId, issueExtraProperties) 递归检查条件链是否满足
- [ ] 4.3 IssueTypeExtraProperty store 在 binding 创建/删除后自动刷新 binding 列表（因为后端会自动创建/删除 condition binding）

## 5. 前端设置 UI

- [ ] 5.1 Extra property form 的 select/multiselect 选项编辑器：每个选项行增加 "Extra Input" 下拉选择器（列出同 workspace 的其他 config，排除自身和循环），选择后显示 "必填" 开关
- [ ] 5.2 Extra property form 的 checkbox 类型：true_value/false_value 旁各增加 "Extra Input" 下拉选择器和 "必填" 开关
- [ ] 5.3 前端循环引用过滤：下拉选择器中排除会形成循环的 config（从 store 中构建依赖图判断）

## 6. 前端 Binding List UI

- [ ] 6.1 ExtraPropertyBindingList 组件中 condition binding 以缩进 + 标签展示，隐藏解绑 checkbox，保留拖拽手柄
- [ ] 6.2 Condition binding 的 is_required 开关隐藏（由父属性 extra_input.required 控制）

## 7. 前端 Sidebar 渲染

- [ ] 7.1 WorkItemAdditionalSidebarProperties 组件：遍历 bindings 时，对 condition binding 调用 isConditionMet 判断是否渲染；条件不满足时隐藏（不渲染）
- [ ] 7.2 Condition property 可见时，根据 binding.is_required 显示必填标识

## 8. 前端 Layout 渲染

- [ ] 8.1 WorkItemLayoutAdditionalProperties 组件（List/Kanban）：对 condition binding 调用 isConditionMet，匹配时渲染可编辑控件，不匹配时渲染灰色占位（复用现有 !isValid 逻辑）
- [ ] 8.2 Spreadsheet issue-row：对 condition property 列，按行检查 isConditionMet，匹配时可编辑，不匹配时灰色占位

## 9. 国际化

- [ ] 9.1 新增翻译键：extra input 相关的 UI 文案（"Extra Input"、"必填"、循环引用错误提示、condition binding 标签等），支持 en/zh-CN/zh-TW
