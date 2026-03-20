## Why

刷新页面后，Work Items 页面的过滤按钮可以立即点击，但此时过滤器实例尚未创建（因为 SWR 异步拉取过滤配置还未完成），导致控制台报错 `Filters toggle error - filter instance not available`，且过滤面板无法打开。若先访问 Views 页面再返回，则过滤器实例已存在于全局 store，按钮可正常使用。

## What Changes

- 修复 `FiltersToggle` 组件：当 `filter` 实例为 undefined 时，禁用过滤按钮（而非报错后静默失败），待 MobX 响应式感知到实例创建后自动恢复可用
- 移除误导性的 `console.error`，改为更合理的行为

## Capabilities

### New Capabilities

<!-- 无新能力引入 -->

### Modified Capabilities

<!-- 无 spec 级别的行为变更，仅修复实现层面的错误状态处理 -->

## Impact

**涉及文件：**

- `apps/web/core/components/rich-filters/filters-toggle.tsx` — 主要修改点：过滤按钮禁用逻辑

**根因说明：**

- `ProjectLayoutRoot` 通过 SWR 异步加载 `workItemFilters`，期间返回空渲染，`ProjectLevelWorkItemFiltersHOC` 未挂载，过滤器实例未创建
- 页面 Header 中的 `WorkItemFiltersToggle` 独立渲染（在 Header 组件树中，与 layout 内容分离），调用 `getFilter()` 返回 undefined
- SWR 完成后，`ProjectLayoutRoot` 重新渲染，HOC 挂载，`getOrCreateFilter()` 创建实例，MobX 响应式触发 `WorkItemFiltersToggle` 重渲染，按钮自动恢复

**修复策略：**
在 `FiltersToggle` 中为 `IconButton` 添加 `disabled={!filter}` 属性，使按钮在过滤器实例未就绪时呈禁用状态，实例创建后 MobX 响应式自动启用按钮，无需额外轮询或初始化逻辑。

**上游冲突风险：**

- `filters-toggle.tsx` 是本地新增文件（rich-filters 体系为自定义功能），无上游冲突风险
