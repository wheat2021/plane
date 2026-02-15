## Why

当前工作项的 Extra Properties（额外属性）仅在编辑界面（issue detail sidebar）中可见。在创建工作项的模态框中，`WorkItemModalAdditionalProperties` 组件返回 `null`，`IssueModalProvider` 中的验证函数 (`handlePropertyValuesValidation`, `getActiveAdditionalPropertiesLength`, `handleCreateUpdatePropertyValues`) 均为空实现。这导致用户无法在创建时填写额外属性，也无法在提交前验证 `is_required` 字段，必须创建后再到编辑界面补充。

## What Changes

- 实现 `WorkItemModalAdditionalProperties` 组件，根据表单中选择的 `type_id` 动态加载对应的额外属性控件
- 实现 `IssueModalProvider` 中的 `getActiveAdditionalPropertiesLength` 方法，返回当前 work item type 绑定的额外属性数量
- 实现 `IssueModalProvider` 中的 `handlePropertyValuesValidation` 方法，检查所有 `is_required=true` 的绑定属性是否已填写
- 实现 `IssueModalProvider` 中的 `handleCreateUpdatePropertyValues` 方法，在工作项创建/更新后将额外属性值写入 issue
- 在创建表单中，额外属性值通过 `issuePropertyValues` context state 管理（而非 React Hook Form），因为 `extra_properties` 需要在 issue 创建后通过单独的 API 调用写入
- 当用户切换 work item type 时，重新加载对应的绑定属性并重置属性值

## Capabilities

### New Capabilities

- `create-form-extra-properties`: 在工作项创建模态框中，根据选择的 work item type 动态渲染额外属性控件，管理属性值状态，并在提交时执行 is_required 验证

### Modified Capabilities

- `project-extra-property-binding`: 需要在创建流程中使用绑定数据来确定显示哪些属性和哪些是必填的

## Impact

- **前端组件**: `apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx`（从 null 变为完整实现）、`apps/web/ce/components/issues/issue-modal/provider.tsx`（实现 3 个 stub 方法）
- **依赖的 Store**: `issue-type-extra-property.store`（已有 fetchBindings/getBindings）、`extra-property-config.store`（已有 fetchWorkspaceConfigs/getConfigById）
- **表单流程**: form.tsx 中现有的调用点（`activeAdditionalPropertiesLength`、`handlePropertyValuesValidation`、`handleCreateUpdatePropertyValues`）无需改动，只需 provider 提供真实实现
- **上游风险**: 低。修改的文件（provider.tsx、modal-additional-properties.tsx）均为 CE 层自定义组件，不与上游冲突
