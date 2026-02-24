## ADDED Requirements

### Requirement: 过滤按钮在实例未就绪时呈禁用状态

`FiltersToggle` 组件在 `filter` 实例为 undefined 时，SHALL 渲染禁用状态的过滤按钮，而非可点击但触发错误的按钮。按钮禁用期间不触发任何副作用（无 console.error、无静默失败）。

#### Scenario: 页面刷新后立即点击过滤按钮

- **WHEN** 用户刷新 Work Items 页面，SWR 尚未完成过滤配置加载时点击过滤按钮
- **THEN** 过滤按钮呈禁用状态，无法点击，控制台无报错

#### Scenario: 过滤配置加载完成后按钮自动启用

- **WHEN** SWR 完成 fetchFilters 请求，WorkItemFilterStore 中的实例被创建
- **THEN** 过滤按钮自动变为可用状态（无需用户刷新），可正常打开过滤面板

#### Scenario: filter 实例已存在时按钮正常可用

- **WHEN** filter 实例已在 WorkItemFilterStore 中存在（非首次加载或已从其他页面导航回来）
- **THEN** 过滤按钮立即可用，点击后正常切换过滤面板显示状态
