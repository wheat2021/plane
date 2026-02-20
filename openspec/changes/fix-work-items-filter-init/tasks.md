## 1. 修改 FiltersToggle 组件

- [x] 1.1 在 `apps/web/core/components/rich-filters/filters-toggle.tsx` 的 `IconButton` 上添加 `disabled={!filter}` 属性
- [x] 1.2 移除 `handleToggleFilter` 中当 `filter` 为 undefined 时的 `console.error` 调用（因为按钮禁用后该路径不再可达）

## 2. 修复 getFilter 响应式追踪

- [x] 2.1 在 `packages/shared-state/src/store/work-item-filters/filter.store.ts` 中，将 `getFilter` 从 `computedFn` 改为普通方法，移除 `computedFn` import

## 3. 验证

- [ ] 2.1 刷新 Work Items 页面后立即点击过滤按钮，确认按钮呈禁用状态且控制台无报错
- [ ] 2.2 等待页面加载完成（约 1-2 秒），确认过滤按钮自动变为可用并可正常打开过滤面板
- [ ] 2.3 正常使用过滤功能（添加/删除条件），确认原有功能未受影响
