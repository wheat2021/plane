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

### Decision 3：将 `getFilter` 从 `computedFn` 改为普通方法

**问题**：`WorkItemFilterStore.getFilter` 使用 `computedFn`（mobx-utils），在 `keepAlive: false`（默认）模式下，当 observer 组件首次渲染时 `getFilter` 返回 `undefined`，`computedFn` 创建的 computed 可能在 React 18 并发渲染周期中被 `onBecomeUnobserved` 过早清理，导致后续 `filters.set()` 不会触发组件重渲染。

**选择**：将 `getFilter` 改为普通方法，直接返回 `this.filters.get(key)`。observer 组件在 render 中调用时，MobX 会直接追踪 observable Map 的 `get` 操作，当 Map 被 `set` 时可靠地触发重渲染。

**拒绝替代方案**：给 `computedFn` 设置 `keepAlive: true` 会引入内存泄漏风险（每个 entityType+entityId 组合的 computed 永远不会被 GC）。

## Risks / Trade-offs

| 风险                                | 缓解                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `fetchFilters` 失败导致按钮永久禁用 | 这是正确行为（过滤配置加载失败时不应开放过滤）；错误处理属于独立需求                      |
| `IconButton` 不支持 `disabled` prop | 已确认 `@plane/propel/icon-button` 的 `IconButton` 继承 HTML button 属性，支持 `disabled` |
| 禁用期间用户体验                    | SWR 在局域网/本地开发下响应极快（< 200ms），禁用窗口极短，不影响正常使用                  |
