## Tasks

- [x] ### Task 1: 扩展 TIssuePropertyValues 和 TIssuePropertyValueErrors 类型定义

**文件**: `apps/web/ce/types/issue-types/issue-property-values.d.ts`

**当前状态**: 两个类型均为空 `object`

**变更**:

```typescript
import type { TExtraPropertyValue } from "@plane/types";

export type TIssuePropertyValues = Record<string, TExtraPropertyValue>;
export type TIssuePropertyValueErrors = Record<string, string>;
```

**验收标准**: 类型定义支持存储 key-value 形式的属性值和错误信息

---

- [x] ### Task 2: 实现 IssueModalProvider 的三个核心方法

**文件**: `apps/web/ce/components/issues/issue-modal/provider.tsx`

**变更**:

1. 添加 `issuePropertyValues` 和 `issuePropertyValueErrors` 的真实 state（替换空 stub）
2. 实现 `getActiveAdditionalPropertiesLength`:
   - 从 `watch("type_id")` 获取当前选中的 work item type
   - 使用 `useIssueTypeExtraProperty().getBindings(projectId, typeId)` 获取绑定列表
   - 返回绑定数量
3. 实现 `handlePropertyValuesValidation`:
   - 获取当前 type_id 的绑定列表
   - 过滤 `is_required=true` 的绑定
   - 检查 `issuePropertyValues` 中对应属性是否有值（null/undefined/空字符串/空数组视为空，checkbox 的 false 为有效值）
   - 如有缺失，设置 `issuePropertyValueErrors` 并 toast 提示，返回 false
   - 全部通过返回 true
4. 实现 `handleCreateUpdatePropertyValues`:
   - 如果 `issuePropertyValues` 为空 or 无值，直接 return
   - 调用 `updateIssue(workspaceSlug, projectId, issueId, { extra_properties: issuePropertyValues })` 写入属性值
   - 写入完成后清空 `issuePropertyValues`

**依赖的 hooks**:

- `useIssueTypeExtraProperty()` — getBindings, fetchBindings
- `useExtraPropertyConfig()` — getConfigById, fetchWorkspaceConfigs
- `useIssueDetail()` — updateIssue

**验收标准**:

- `getActiveAdditionalPropertiesLength` 根据当前 type 返回正确的属性数量
- `handlePropertyValuesValidation` 正确检查 is_required 属性并返回 boolean
- `handleCreateUpdatePropertyValues` 在 issue 创建后将属性值保存到 issue

---

- [x] ### Task 3: 实现 WorkItemModalAdditionalProperties 组件

**文件**: `apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx`

**当前状态**: 返回 `null`

**变更**:

1. 使用 `useFormContext<TIssue>()` 的 `watch("type_id")` 获取当前 work item type
2. 使用 `useIssueModal()` 获取 `issuePropertyValues`, `setIssuePropertyValues`, `issuePropertyValueErrors`
3. 通过 `useIssueTypeExtraProperty()` 和 `useExtraPropertyConfig()` 获取绑定和配置
4. 添加 useEffect 在 `projectId + type_id` 变化时获取数据（复用编辑界面的 fetchBindings 和 fetchWorkspaceConfigs 模式）
5. 添加 useEffect 在 type_id 变化时清空 `issuePropertyValues`
6. 计算 configs 列表（同编辑界面的 useMemo 逻辑）
7. 渲染 `ExtraPropertyRenderer`，将 `issuePropertyValues` 作为 values，onChange 回调更新 `setIssuePropertyValues`
8. 无属性时返回 null

**参考**: `apps/web/ce/components/issues/issue-details/additional-properties.tsx`（编辑界面实现）

**验收标准**:

- 选择有绑定属性的 work item type 后，创建模态框中显示对应的属性控件
- 填写属性值后，值存入 context state
- 切换 type 后，属性列表更新且之前的值被清空
- 无绑定属性的 type 不显示任何控件

---

- [x] ### Task 4: 验证集成与端到端流程

**手动测试清单**:

1. 创建工作项时选择有额外属性的 work item type → 属性控件应出现
2. 填写所有必填属性后提交 → 创建成功，属性值保存到 issue
3. 不填写必填属性提交 → 弹出 toast 错误提示，表单不提交
4. 切换 work item type → 属性控件更新，之前的值清空
5. 选择无额外属性的 type → 无属性控件显示
6. "创建更多"模式 → 每次创建后属性值清空
7. 编辑已有 issue 的额外属性 → 现有编辑界面不受影响
