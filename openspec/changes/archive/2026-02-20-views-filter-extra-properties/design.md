## Context

项目已实现 Extra Properties（自定义属性）功能，支持在 workspace 级别配置属性，在项目层绑定到 issue type，并在视图列中展示（Extra Display Properties）。与此同时，项目使用 Rich Filter 系统支持按标准属性（state、priority、assignee 等）筛选工作项——该系统由 `TWorkItemFilterExpression`（AND/OR 条件树）表达，通过 `useWorkItemFiltersConfig` Hook 动态生成筛选器配置。

**当前约束**：

- `TWorkItemFilterProperty` 是静态字符串字面量联合类型（`WORK_ITEM_FILTER_PROPERTY_KEYS` 数组派生），不原生支持动态 key
- 筛选器 UI 组件（`DisplayFiltersSelection`、`WorkItemFiltersRow`）是通用的，只依赖 config 对象，无需修改
- 后端 `issue_filters.py` 负责将 filter 表达式转换为 ORM 查询，不了解 extra property 语义

## Goals / Non-Goals

**Goals:**

- 在 Views / 工作项列表的筛选器面板中动态展示当前项目可用的 Extra Properties
- 用户可选择 Extra Property 作为筛选维度，并选择属性值进行筛选
- 筛选条件可保存到 View 并在下次打开时自动恢复
- MVP 优先支持 `option` 和 `multi_option` 类型的 Extra Properties

**Non-Goals:**

- MVP 不支持 text / number / date 类型的 Extra Property 筛选（类型映射复杂，延后实现）
- 不修改 Extra Display Properties 的显示/隐藏逻辑
- 不引入新的 API 端点（复用现有 `rich_filters` 字段）

## Decisions

### 决策 1：Filter Key 格式——使用 `extra_property_<configId>` 前缀

**选项 A**：`extra_property_<configId>`——在 `TWorkItemFilterProperty` 中引入模板字面量类型 `` `extra_property_${string}` ``

**选项 B**：单独字段——在 `TWorkItemFilterExpression` 外新增 `extra_property_filters` 字段

**选择 A，理由**：

- 与现有 `rich_filters` 字段无缝集成，无需改 API schema 和 View 数据模型
- Rich Filter 的 AND/OR 组合逻辑自动适用于 Extra Property 条件
- TypeScript 模板字面量类型可正确表达动态 key，同时保持类型安全

**实现**：

```typescript
type TExtraPropertyFilterKey = `extra_property_${string}`;
type TWorkItemFilterProperty = (typeof WORK_ITEM_FILTER_PROPERTY_KEYS)[number] | TExtraPropertyFilterKey;
```

条件 key 示例：`extra_property_<configId>__in`

---

### 决策 2：操作符映射——按 Extra Property 类型选择操作符

MVP 仅支持 `option` / `multi_option` 类型，统一使用 `COLLECTION_OPERATOR.IN`（多值匹配），与 state、label 等标准属性一致。

后续扩展路径：text → `contains`/`exact`；number → `range`；date → `range`。

---

### 决策 3：动态 Filter Config 生成——在 useWorkItemFiltersConfig 中注入

**选项 A**：在 `useWorkItemFiltersConfig` Hook 内动态生成 Extra Property filter configs 并追加到返回列表

**选项 B**：新建单独的 Hook，在使用处合并两个 Hook 结果

**选择 A，理由**：

- 调用方（views form、filter HOC 等）无需感知 extra properties 的存在
- 现有的 filter UI 组件直接消费 `configs` 列表，天然支持动态追加
- 减少 Hook 调用层的复杂度

**实现**：在 Hook 内通过 `useExtraPropertyConfig` 和 `useIssueTypeExtraProperty` 获取项目可用的 extra property configs，为每个 `option`/`multi_option` 类型的 config 生成 `TFilterConfig` 对象并追加到 `configs` 列表。

---

### 决策 4：后端查询——在 issue_filters.py 中检测并转换

后端接收到 `rich_filters` JSON 后，遍历所有条件 key，识别以 `extra_property_` 开头的 key，提取 `configId`，然后：

1. 查询 `IssueExtraProperty`（或相关模型）中 `config_id = configId` 的记录
2. 对记录的 value 字段做 `in` 过滤，返回匹配的 issue ID 集合

具体 ORM 查询形式待后端模型确认后细化（任务中标注为需调研）。

## Risks / Trade-offs

**[风险] 模板字面量类型扩展影响类型推导性能**
→ 在 `TWorkItemFilterProperty` 中混入 `string` 宽类型可能导致 TypeScript 编译时某些类型检查降级。缓解措施：限定为 `` `extra_property_${string}` `` 而非宽 `string`，减小影响范围。

**[风险] 上游 `view-props.ts` 类型文件冲突**
→ 上游持续维护此文件，rebase 时可能产生冲突。缓解措施：修改尽量集中且最小化，扩展而非修改现有行为。

**[风险] 后端 `issue_filters.py` 修改引入回归**
→ 该文件是 filter 的核心工具，修改可能影响其他 filter 类型。缓解措施：新增处理逻辑作为独立分支（key 前缀检测），不改动现有路径；充分测试现有筛选器功能。

**[取舍] MVP 仅支持 option/multi_option 类型**
→ 用户暂时无法按 text/number/date 类型的 Extra Property 筛选，但可减少初版复杂度，更早交付核心价值。

## Migration Plan

- 无数据库迁移（`rich_filters` 已为 JSONField，向下兼容）
- 无破坏性 API 变更
- 旧版 Views 的 `rich_filters` 不含 extra property 条件，行为不变
- 部署时无需特殊步骤，前后端同步上线即可

## Open Questions

1. **后端 Extra Property 值存储模型**：`IssueExtraProperty`（或等效模型）的字段结构是什么？option 类型的值是存 option ID 还是 option label？需调研后确认 ORM 查询写法。
2. **跨 issue type 筛选**：若项目同时有多个 issue type，不同 type 绑定不同的 extra properties，筛选时如何处理未绑定该属性的工作项？（建议：未绑定的工作项不出现在筛选结果中，视为"无此属性值"）
3. **`useWorkItemFiltersConfig` 的 projectId 依赖**：Hook 目前是否已接收 `projectId` 参数来获取项目级绑定数据？需确认数据获取时机。
