## 1. 修复前端 addIssueToStore

- [x] 1.1 [UPSTREAM-RISK] 在 `apps/web/core/store/issue/issue-details/issue.store.ts` 的 `addIssueToStore` 中添加 `extra_properties: issue?.extra_properties`

## 2. 修复后端列表接口

- [x] 2.1 [UPSTREAM-RISK] 在 `apps/api/plane/app/serializers/issue.py` 的 `IssueListDetailSerializer.to_representation` 中添加 `"extra_properties": instance.extra_properties`
- [x] 2.2 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/issue/base.py` 的 `IssueViewSet.list` 的 `.values()` 中添加 `"extra_properties"`
- [x] 2.3 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/issue/base.py` 的 `IssuePaginatedViewSet.list` 的 `required_fields` 中添加 `"extra_properties"`

## 3. 验证

- [ ] 3.1 刷新列表视图，确认 Extra Property 列直接显示正确值（无需打开详情）
- [ ] 3.2 修改 Extra Property 后刷新页面，确认值已保存
- [x] 3.3 运行 TypeScript 类型检查：`pnpm check:types`，确认无新增类型错误
