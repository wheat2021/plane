## Context

当前 Plane list/kanban 分组系统由以下部分构成：

- `TIssueGroupByOptions`（硬编码字面量联合类型）控制允许的分组键
- `ISSUE_GROUP_BY_KEY` / `ISSUE_FILTER_DEFAULT_DATA`（Record 静态映射）将分组键映射到 `TIssue` 字段
- `getGroupByColumns`（switch map）生成每个分组的列定义（标题、图标、payload）
- 后端 `issue_queryset_grouper` 对 QuerySet 做 annotation，`issue_group_values` 返回所有分组的有效值，`GroupedOffsetPaginator` 按 `group_by_field_name` annotation 分桶

Extra property 的值存储在 `Issue.extra_properties`（JSONField），以 `ExtraPropertyConfig.key`（短字符串）为键，格式：`{"severity": "high", "department": "eng"}`。属性与 issue type 的绑定关系存储在 `IssueTypeExtraProperty`。

## Goals / Non-Goals

**Goals:**

- list/kanban 视图支持按 `select` 类型 extra property 分组
- 分组列区分"未设置"（属于该类型但无值）与"不适用"（issue 类型不支持该属性）
- 支持拖拽工作项到目标列更新 extra property 值
- 不破坏现有分组系统的类型安全与运行时逻辑

**Non-Goals:**

- `member`、`multiselect` 等其他 extra property 类型的分组支持
- sub-group by 的 extra property 支持
- workspace 级别视图（Profile、Workspace）的 extra property 分组
- spreadsheet / calendar 视图

## Decisions

### 决策 1：group_by 键编码方式 — `extra_property:{key}` 模板格式

**选择**：URL 参数使用 `extra_property:{config.key}` 格式，如 `extra_property:severity`。

**理由**：

- 使用 `config.key`（短字符串）而非 UUID，因为 `Issue.extra_properties` 本身就以 `key` 为索引
- 单参数编码，不增加新的 URL 参数，对现有 filter store 持久化逻辑无侵入
- 可读性好，便于调试

**备选**：新增独立 `extra_group_by` URL 参数 → 所有使用 `group_by` 的地方都要双判断，改动量翻倍，放弃。

**备选**：使用 config UUID → `extra_properties` 不以 UUID 为键，后端需要多一次 key↔id 转换，放弃。

### 决策 2：TypeScript 类型扩展 — 模板字面量联合类型

**选择**：

```ts
export type TExtraPropertyGroupBy = `extra_property:${string}`;
export type TIssueGroupByOptions = "state" | "priority" | ... | TExtraPropertyGroupBy | null;
```

**理由**：TypeScript 4.1+ 支持模板字面量类型参与联合，无需改为 `string`，保持其他字面量成员的类型安全。

`ISSUE_GROUP_BY_KEY` 和 `ISSUE_FILTER_DEFAULT_DATA` 当前是 `Record<TIssueDisplayFilterOptions, keyof TIssue>`，无法静态枚举模板字面量键，改为 `getGroupByKey(groupBy)` 辅助函数，带运行时前缀判断。

### 决策 3：后端 annotation 命名规范 — `ep__{key}`

**选择**：Django annotation 名使用 `ep__{config.key}`（如 `ep__severity`），作为 `group_by_field_name` 传入 Paginator。

**理由**：

- Django field name 不支持 `:` 字符，必须 sanitize
- `ep__` 前缀短且具有辨识度，与现有 annotation 名（`assignee_ids`、`label_ids` 等）不冲突
- Paginator 的 `.values(group_by_field_name)` 和 `result.get(group_by_field_name)` 直接使用 annotation 名

**sanitize 函数**（统一在 view 层和 grouper 层使用）：

```python
def ep_annotation_name(group_by: str) -> str:
    return "ep__" + group_by[len("extra_property:"):]
```

### 决策 4：双 None 区分 — Case/When + sentinel 字符串

**选择**：

- `"None"` — 属于绑定类型但未设置值（与现有 None 惯例一致）
- `"__none_unsupported__"` — issue 类型未绑定该属性

后端使用 `Case(When(~Q(type_id__in=supported_type_ids), Value("__none_unsupported__")), default=Coalesce(KeyTextTransform(...), Value("None")))` 实现。

前端 `isDropDisabled: true` 标记 `__none_unsupported__` 列，禁止拖入。

### 决策 5：extra property 选项不加入静态常量

`ISSUE_DISPLAY_FILTERS_BY_PAGE`（packages/constants）是静态定义，无法包含运行时才知道的 property key。

**选择**：在 `FilterGroupBy` 组件内额外渲染 extra property 选项区块，直接读取当前项目的 select 类型属性配置，不修改静态常量。

## Risks / Trade-offs

- **[风险] `type_id=null` 的工作项**：无 issue type 的工作项，`supported_type_ids` 不包含 null，会被归入 `__none_unsupported__` 组。这是合理的行为（无类型的工作项不支持任何 extra property），但需在 UI 说明。
  → 接受此行为，`__none_unsupported__` 列的 tooltip 说明"无工作项类型或类型不支持此属性"。

- **[风险] filter store 持久化跨项目失效**：localStorage 中存储的 `group_by=extra_property:severity`，切换到无 `severity` 属性的项目时 UI 显示异常。
  → 在 filter store 初始化时校验：若 `group_by` 以 `extra_property:` 开头且当前项目无该属性，reset 为 `null`。

- **[风险] `ISSUE_GROUP_BY_KEY` Record→函数改造调用点分散**
  → 统一用 `getGroupByKey(groupBy)` 替换所有直接访问，调用点约 5 处，影响可控。

- **[风险] 上游合并冲突**：`utils.tsx`、`base-issues.store.ts`、`grouper.py` 等文件均为上游活跃文件，rebase 时有冲突风险。
  → 尽量以最小侵入方式扩展（加分支而非改现有逻辑），减少冲突面积。

- **[Trade-off] annotation 字段泄漏到前端**：`issue_on_results` 返回的 issue dict 会包含 `ep__severity` 字段，前端 TypeScript 类型不含此字段会报错。
  → 在 `issue_on_results` 末尾过滤掉所有 `ep__` 开头的字段，保持 API 响应干净。

## Migration Plan

无数据库迁移，不涉及存储格式变更。功能开关：无（直接生效，依赖当前项目是否有 select 类型 extra property；若无则选项不展示）。

## Open Questions

- workspace 级别的「我的工作项」视图是否需要支持？（当前 Non-Goal，可后续扩展）
- `__none_unsupported__` 的本地化文案待定，暂用「不适用」。
