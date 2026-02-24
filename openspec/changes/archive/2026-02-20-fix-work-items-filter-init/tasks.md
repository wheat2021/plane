## 1. 修改 FiltersToggle 组件

- [x] 1.1 在 `apps/web/core/components/rich-filters/filters-toggle.tsx` 的 `IconButton` 上添加 `disabled={!filter}` 属性
- [x] 1.2 移除 `handleToggleFilter` 中当 `filter` 为 undefined 时的 `console.error` 调用（因为按钮禁用后该路径不再可达）

## 2. 修复 getOrCreateFilter 在 render 阶段修改 observable 的问题

- [x] 2.1 在 `apps/web/core/components/work-item-filters/filters-hoc/base.tsx` 中，将 `WorkItemFilterRoot` 的 `getOrCreateFilter` 从 `useMemo` 改为 `useEffect` + `useState`，避免 render 阶段修改 observable Map

## 3. 验证

- [x] 2.1 刷新 Work Items 页面后立即点击过滤按钮，确认按钮呈禁用状态且控制台无报错 ✅ 2026-02-20
- [x] 2.2 等待页面加载完成（约 1-2 秒），确认过滤按钮自动变为可用并可正常打开过滤面板 ✅ 2026-02-20
- [x] 2.3 正常使用过滤功能（添加/删除条件），确认原有功能未受影响 ✅ 2026-02-20
