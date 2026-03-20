## Context

当前创建工作项的模态框中，`WorkItemModalAdditionalProperties` 组件返回 `null`，`IssueModalProvider` 中的三个关键方法（`getActiveAdditionalPropertiesLength`、`handlePropertyValuesValidation`、`handleCreateUpdatePropertyValues`）均为 stub。用户在创建表单中选择了 work item type 后，看不到该类型绑定的额外属性，也无法填写值。

现有基础设施：

- `IssueTypeExtraPropertyStore` 已实现 `fetchBindings()`/`getBindings()` 方法
- `ExtraPropertyConfigStore` 已实现 `fetchWorkspaceConfigs()`/`getConfigById()` 方法
- `ExtraPropertyRenderer`/`ExtraPropertyControl` 组件可复用
- 编辑界面的 `WorkItemAdditionalSidebarProperties` 已提供完整的数据获取和渲染参考
- `base.tsx` 已在 issue 创建后调用 `handleCreateUpdatePropertyValues`

## Goals / Non-Goals

**Goals:**

- 在创建模态框中，根据选中的 work item type 显示对应的额外属性控件
- 用户可在创建时填写属性值
- 提交前验证 `is_required=true` 的属性是否已填写
- 创建成功后将属性值写入 issue 的 `extra_properties`

**Non-Goals:**

- 不修改现有的 store/service 层（已有完整的 CRUD）
- 不修改 `ExtraPropertyRenderer`/`ExtraPropertyControl` 组件
- 不修改 form.tsx 中的调用点（已预留好接口）
- 不处理 draft issue 的属性值持久化（现有 stub 行为可接受）

## Decisions

### D1: 属性值存储在 context state 中而非 React Hook Form

额外属性值通过 `issuePropertyValues` / `setIssuePropertyValues`（已定义在 `IssueModalContext` 中）管理，不直接存入 React Hook Form。

**理由**: `extra_properties` 需要在 issue 创建后通过 `updateIssue` API 单独写入（因为创建时尚无 issue ID）。使用 context state 管理属性值与现有架构（`handleCreateUpdatePropertyValues` 接收 issueId 后更新）保持一致。同时 `TIssuePropertyValues` 和 `TIssuePropertyValueErrors` 类型需要从空 object 类型扩展为具体的 Record 类型。

**替代方案**: 将 `extra_properties` 加入 React Hook Form 的 defaultValues，在 formData 中直接提交。虽然更简单，但与现有的 `handleCreateUpdatePropertyValues` 后置更新模式不一致，且 form.tsx 为核心共享文件（高上游风险）。

### D2: 复用 ExtraPropertyRenderer 组件

创建表单中直接复用编辑界面使用的 `ExtraPropertyRenderer` 组件，传入从 context state 读取的 values 和 onChange 回调。

**理由**: 避免重复实现控件逻辑。`ExtraPropertyRenderer` 已支持所有属性类型，且接口（configs + values + onChange）与创建场景完全兼容。

### D3: 数据获取时机跟随 type_id 变化

在 `WorkItemModalAdditionalProperties` 中监听表单的 `type_id` 字段变化，触发 `fetchBindings` 和 `fetchWorkspaceConfigs`。切换 type 时清空已填写的属性值。

**理由**: 与编辑界面的数据流一致。Store 内部有 `fetchedMap` 缓存，重复切换不会多次请求。

### D4: 验证错误通过 toast 提示

`handlePropertyValuesValidation` 失败时，通过 `setToast` 提示用户哪些必填属性未填写，同时在 `issuePropertyValueErrors` 中记录错误状态以标记对应字段。

**理由**: 与现有表单验证行为一致（如编辑器未准备好时的 toast 提示），且 toast 可以展示多个缺失字段的信息。

## Risks / Trade-offs

- **[Risk] 创建后更新的时间差**: 属性值在 issue 创建后才写入，短暂的时间窗口内 issue 存在但无属性值 → 可接受，因为这是一个原子操作序列，且其他 property values（如模板属性）也采用同样模式
- **[Risk] 切换 type 丢失已填写值**: 用户切换 work item type 时，之前填写的属性值会被清空 → 合理行为，不同 type 绑定的属性不同
- **[Trade-off] 修改 CE 类型定义**: 需要将 `TIssuePropertyValues` 和 `TIssuePropertyValueErrors` 从空 object 改为具体类型 → 仅影响 CE 层，不影响上游
