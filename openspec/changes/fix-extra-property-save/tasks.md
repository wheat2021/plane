## 1. 修复 addIssueToStore 遗漏 extra_properties

- [x] 1.1 [UPSTREAM-RISK] 在 `apps/web/core/store/issue/issue-details/issue.store.ts` 的 `addIssueToStore` 方法中，`issuePayload` 对象的 `type_id` 之后添加 `extra_properties: issue?.extra_properties`

## 2. 验证

- [ ] 2.1 在工作项详情页修改任意 Extra Property（如 Severity），刷新页面后确认值已保存
- [ ] 2.2 在列表视图中确认 Extra Property 列显示正确的值
- [x] 2.3 运行 TypeScript 类型检查：`pnpm check:types`，确认无新增类型错误
