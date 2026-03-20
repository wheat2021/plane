## 1. 修复后端字段列表遗漏

- [x] 1.1 [UPSTREAM-RISK] 在 `apps/api/plane/utils/grouper.py` 的 `issue_on_results` 的 `required_fields` 中添加 `"extra_properties"`
- [x] 1.2 [UPSTREAM-RISK] 在 `apps/api/plane/app/serializers/issue.py` 的 `IssueListDetailSerializer.to_representation` 中添加 `"extra_properties": instance.extra_properties`
- [x] 1.3 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/issue/base.py` 的 `IssueViewSet.list` 的 `.values()` 中添加 `"extra_properties"`
- [x] 1.4 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/issue/base.py` 的 `IssueViewSet.create` 的 `.values()` 中添加 `"extra_properties"`
- [x] 1.5 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/issue/base.py` 的 `IssuePaginatedViewSet.list` 的 `required_fields` 中添加 `"extra_properties"`

## 2. 修复前端 store 字段映射

- [x] 2.1 [UPSTREAM-RISK] 在 `apps/web/core/store/issue/issue-details/issue.store.ts` 的 `addIssueToStore` 中添加 `extra_properties: issue?.extra_properties`

## 3. 修复展示场景 default_value 误用

- [x] 3.1 在 `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx` 中移除 `config.default_value` fallback
- [x] 3.2 在 `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx` 中移除 `config.default_value` fallback
- [x] 3.3 在 `apps/web/core/components/issues/issue-layouts/spreadsheet/issue-row.tsx` 中移除 `config.default_value` fallback

## 4. 验证

- [x] 4.1 刷新列表视图，确认 Extra Property 列直接显示正确值
- [x] 4.2 修改 Extra Property 后刷新页面，确认值已保存
- [x] 4.3 未设置 Extra Property 的工作项显示为空/未设置状态
- [x] 4.4 运行 TypeScript 类型检查：`pnpm check:types`，确认无新增类型错误
