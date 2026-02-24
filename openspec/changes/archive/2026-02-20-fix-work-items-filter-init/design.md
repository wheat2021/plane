## Context

Work Items 页面的 Header 和内容区域属于独立的组件树。Header 中的 `IssuesHeader` → `HeaderFilters` → `WorkItemFiltersToggle` 会立即渲染过滤按钮；而内容区域的 `ProjectLayoutRoot` 通过 SWR 异步获取 `workItemFilters` 后，才挂载 `ProjectLevelWorkItemFiltersHOC` → `WorkItemFiltersHOC` → `WorkItemFilterRoot`，最终在 `WorkItemFilterStore` 中创建过滤器实例。

两者之间存在时序差：SWR 等待 API 响应期间，过滤按钮可点击但实例不存在，点击触发 `console.error`（静默失败）。SWR 完成后，MobX 响应式会自动更新按钮状态，无需额外处理。

**关键数据流：**

```
Header (立即渲染)
  WorkItemFiltersToggle
    getFilter(PROJECT, projectId) → undefined (实例未创建)
    FiltersToggle 渲染 IconButton → 可点击但无效

内容区 (SWR 完成后渲染)
  ProjectLayoutRoot [guard: !workItemFilters → 空渲染]
    ProjectLevelWorkItemFiltersHOC
      WorkItemFiltersHOC [guard: !initialWorkItemFilters → 提前返回]
        WorkItemFilterRoot
          getOrCreateFilter() → 创建实例 ← 此步骤被延迟
```

## Goals / Non-Goals

**Goals:**

- 过滤按钮在实例未就绪时呈禁用状态，而非报错后静默失败
- 实例创建后，MobX 响应式自动启用按钮，无需用户刷新
- 修复范围最小化，不改变初始化架构

**Non-Goals:**

- 不提前创建过滤器实例（会引入空初始值与服务端值的同步问题）
- 不修改 SWR 或 HOC 的初始化时序
- 不处理 fetchFilters 失败的兜底 UI（属于独立问题）

## Decisions

### Decision 1：在 `FiltersToggle` 禁用按钮，而非提前初始化

**选择**：为 `IconButton` 添加 `disabled={!filter}` 属性。

**替代方案 A**：提前挂载 HOC（去掉 `!workItemFilters` 守卫）+ 用空默认值创建实例
**拒绝原因**：创建实例后需要等服务端数据到来时再 `resetExpression`，要额外追踪"用户是否已交互"状态，避免覆盖用户修改。复杂度高，风险大。

**替代方案 B**：在 `handleToggleFilter` 中按需创建实例（lazy init）
**拒绝原因**：`FiltersToggle` 不知道如何创建实例（缺少 `entityType`、`entityId`、`updateFilters` 等上下文），会破坏组件职责边界。

**选择理由**：`FiltersToggle` 已接收 `filter: IFilterInstance | undefined`，禁用逻辑天然属于该组件的视图层。MobX 响应式保证了实例创建后按钮自动启用，不需要额外状态管理。

### Decision 2：移除 `console.error`

当前 `handleToggleFilter` 在 filter 为 undefined 时调用 `console.error`，但因为 `disabled` 后按钮不可点击，此错误路径不再可达。移除该日志，保持代码整洁。

### Decision 3：将 `getOrCreateFilter` 从 render 阶段移到 effect 阶段

**问题**：`WorkItemFilterRoot` 在 `useMemo` 中调用 `getOrCreateFilter`（MobX action），该 action 执行 `this.filters.set()` 修改 observable Map。这发生在 React render 阶段，导致：

1. React 报错 `Cannot update a component while rendering a different component`（render 阶段级联更新）
2. `computedFn` 的 computed 在 React 18 + `useSyncExternalStore` 下可能被过早清理，导致 `WorkItemFiltersToggle` 不会重渲染

**选择**：将 `getOrCreateFilter` 从 `useMemo` 改为 `useEffect` + `useState`。filter 实例在 commit 阶段（effect 中）创建，`filters.set()` 不在 render 阶段执行，MobX 正常通知 `computedFn` 的 computed 重新计算，`WorkItemFiltersToggle` 正确重渲染。

**影响**：`WorkItemFilterRoot` 首次 render 时 filter 为 `undefined`，children 函数需要处理此情况。已确认所有调用方都已对 filter 做了 null/undefined check。

## Risks / Trade-offs

| 风险                                | 缓解                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `fetchFilters` 失败导致按钮永久禁用 | 这是正确行为（过滤配置加载失败时不应开放过滤）；错误处理属于独立需求                      |
| `IconButton` 不支持 `disabled` prop | 已确认 `@plane/propel/icon-button` 的 `IconButton` 继承 HTML button 属性，支持 `disabled` |
| 禁用期间用户体验                    | SWR 在局域网/本地开发下响应极快（< 200ms），禁用窗口极短，不影响正常使用                  |
