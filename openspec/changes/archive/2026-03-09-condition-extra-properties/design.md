## Context

当前 extra property 系统支持 workspace 级别定义属性配置（ExtraPropertyConfig），通过 IssueTypeExtraProperty 绑定到 project 的 issue type。Select/Multiselect 的每个 option 结构为 `{ value, label?, isDefault? }`，Checkbox 有 `true_value`/`false_value` 显示文本。

用户需要根据选项值动态引入额外属性（condition property），例如选择"其他"时出现文本输入框。当前无此能力，所有补充字段只能作为普通属性绑定，导致表单臃肿。

## Goals / Non-Goals

**Goals:**

- Select/Multiselect 的每个 option 可关联一个已有的 ExtraPropertyConfig 作为 extra input
- Checkbox 的 true/false 状态各可关联一个 ExtraPropertyConfig
- 绑定含 extra input 的属性时，自动创建 condition binding
- Workspace config 变更 extra input 时，自动同步到所有已绑定的 project+issueType
- Issue detail sidebar 中 condition property 条件显示/隐藏
- List/Kanban/Spreadsheet 中 condition property 条件可编辑
- 支持嵌套链，禁止循环引用
- Condition binding 不可手动解绑

**Non-Goals:**

- 不支持 text/textarea 类型的 extra input（仅 select/multiselect/checkbox）
- 不支持一个 option 关联多个 extra input（一对一）
- 不在父选项切换时清空 condition property 的已有值
- 不支持 condition property 的 binding 层独立配置（is_required 等由 workspace config 的 extra_input 定义决定）

## Decisions

### 决策 1：extra_input 配置存储在 Workspace Config 层（option 结构内）

**选择**: 在 ExtraPropertyConfig.config JSON 中扩展 option 结构和 checkbox 配置。

**理由**: "选项 B 需要额外输入属性 X" 是属性定义本身的语义，不应因 project 不同而变化。放在 workspace config 层保持单一数据源。

**数据结构变更**:

Select/Multiselect option:

```json
{
  "value": "B",
  "label": "注释",
  "isDefault": false,
  "extra_input": {
    "config": "<ExtraPropertyConfig UUID>",
    "required": false
  }
}
```

Checkbox config:

```json
{
  "options": [],
  "true_value": "Yes",
  "false_value": "No",
  "true_extra_input": {
    "config": "<ExtraPropertyConfig UUID>",
    "required": false
  },
  "false_extra_input": {
    "config": "<ExtraPropertyConfig UUID>",
    "required": false
  }
}
```

`extra_input` 为 null 或不存在表示该选项不关联额外属性。

**替代方案**: 在 binding 层存储 extra_input 配置——被否决，因为会导致同一属性在不同 project 中有不同的 extra input 配置，增加复杂度且语义不合理。

### 决策 2：IssueTypeExtraProperty 增加 condition_config FK 标记

**选择**: 在 IssueTypeExtraProperty 模型上新增 `condition_config` 外键（nullable），指向触发它的父属性的 ExtraPropertyConfig。

```python
condition_config = models.ForeignKey(
    "db.ExtraPropertyConfig",
    on_delete=models.CASCADE,
    null=True,
    blank=True,
    related_name="condition_bindings",
)
```

**理由**:

- `condition_config IS NULL` → 普通绑定（用户手动绑定，可手动解绑）
- `condition_config IS NOT NULL` → condition 绑定（自动创建，不可手动解绑）
- 触发条件（哪些选项值触发）从 workspace config 的 option.extra_input 动态推导，不在 binding 层重复存储
- 同一个 config 被多个选项关联时（如选项 B 和 C 都关联属性 X），只需一条 binding 记录

**替代方案**: 用 JSONField 存储完整的触发条件——被否决，因为会导致数据冗余且同步困难。

### 决策 3：自动 condition binding 管理

**触发时机与动作**:

| 触发场景                             | 动作                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 绑定父属性到 issue type              | 递归检查所有 option 的 extra_input，自动创建 condition binding，sort_order 设为父属性 sort_order + 0.5（嵌套时递增 0.25）                              |
| 更新 workspace config 的 extra_input | 对所有已绑定该 config 的 project+issueType，diff 新旧 extra_input，创建新增的 / 删除移除的 condition binding                                           |
| 解绑父属性                           | 级联删除所有 condition_config 指向该父属性 config 的 binding（递归：如果被删除的 condition binding 本身也是其他 condition binding 的父属性，继续级联） |

**实现位置**: 后端 API view 层，在绑定创建/删除/config 更新的 API handler 中执行。

### 决策 4：循环引用检测

**算法**: 在保存 extra_input 配置时，构建有向图（config → extra_input.config），使用 DFS 检测环。

**检测时机**: ExtraPropertyConfig 更新 API 中，在保存前校验。

**图的构建**: 从当前 workspace 的所有 ExtraPropertyConfig 中提取 extra_input 关系，加上本次变更，检测是否存在环。

**错误响应**: HTTP 400，错误信息包含环路径（如 "循环引用: A → B → C → A"）。

### 决策 5：前端渲染逻辑

**Sidebar（创建/编辑视图）**:

遍历 bindings（按 sort_order）：

- `condition_config == null` → 普通属性，直接渲染
- `condition_config != null` → 查找父属性当前值 → 从 workspace config 的 options 中找出哪些 option 的 extra_input.config 匹配当前 binding 的 extra_property_config → 如果父属性当前值在这些 option 的 value 集合中 → 渲染（可编辑）；否则 → 不渲染（隐藏）

**List/Kanban/Spreadsheet Layout**:

对每个 condition property 列/控件：

- 查找父属性当前值 → 匹配触发选项 → 可编辑控件
- 不匹配 → 灰色 "—" 占位（复用现有 `!isValid` 的渲染逻辑）

**嵌套链**: 递归检查。A→B→C 时，C 的显示需要 B 可见（B 的父选项匹配）且 C 的父选项匹配。

### 决策 6：前端 condition 关系解析

**新增 computed 方法** 在 IssueTypeExtraProperty store 中：

- `getConditionTriggerValues(projectId, issueTypeId, bindingId)`: 返回触发该 condition binding 的父属性选项值集合。通过 binding.condition_config 找到父属性 config，遍历其 options 找出 extra_input.config 匹配的 option values。
- `isConditionMet(projectId, issueTypeId, bindingId, issueExtraProperties)`: 检查给定 issue 的 extra_properties 是否满足该 condition binding 的触发条件（含嵌套链递归检查）。

### 决策 7：Binding list UI 中 condition binding 的展示

Condition binding 在 binding list 中以缩进 + 标签展示，checkbox 禁用（不可手动解绑），无拖拽手柄（sort_order 自动管理，但用户可调整）。

实际上用户可以调整 condition binding 的排序（虽然一般不会），所以保留拖拽手柄但不显示解绑 checkbox。

## Risks / Trade-offs

**[风险] Workspace config 变更时的扇出同步可能较慢**
→ 缓解：同步操作在 API handler 中同步执行（不用 celery），因为绑定数量通常很少（每个 workspace 的 project × issueType 组合有限）。如果未来规模增大，可改为异步任务。

**[风险] 嵌套链过深导致 sidebar 渲染复杂**
→ 缓解：实际业务中嵌套很少超过 2 层。不设硬性层数限制，但循环检测确保不会无限递归。

**[风险] 前端需要从 workspace config 的 options 中动态推导触发条件**
→ 缓解：workspace configs 已在 store 中缓存，推导逻辑为纯计算（遍历 options 数组），性能开销可忽略。

**[权衡] Condition binding 的 is_required 由 workspace config 的 extra_input.required 决定，不在 binding 层独立配置**
→ 简化了模型，但意味着同一个 condition property 在所有 project 的所有 issue type 中 required 状态一致。这符合"属性定义是 workspace 级别"的设计原则。

**[权衡] 父选项切换时保留 condition property 的已有值**
→ 数据冗余但用户体验好（误操作可恢复）。Filter 基于实际存储值筛选，不检查父选项是否匹配。
