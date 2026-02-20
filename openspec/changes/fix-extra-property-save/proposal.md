## Why

用户在工作项详情页修改 Extra Property（如 Severity）后，值无法持久保存。经代码分析，根因是 `addIssueToStore` 方法在将 API 返回的 issue 数据映射到 store 时，显式列举了所有字段但**遗漏了 `extra_properties`**。这导致：

1. 通过详情页 `fetchIssue` 加载工作项时，`extra_properties` 被丢弃
2. 用户修改 extra property 后，`updateIssue` 虽然成功调用 API 保存到数据库，但随后 store 中的 issue 对象缺少 `extra_properties` 字段
3. 页面刷新后 `fetchIssue` 再次加载时，`addIssueToStore` 再次丢弃 `extra_properties`，用户看到的值为空

这是一个共性问题，影响所有 Extra Property 类型（text、select、multiselect、checkbox 等），不仅限于 Severity。

## What Changes

- 在 `addIssueToStore` 方法中补充 `extra_properties` 字段映射，确保从 API 获取的 extra property 数据正确保留到 store

## Capabilities

### Modified Capabilities

（无 spec 级别的行为变更，仅修复已有功能的数据丢失 bug）

## Impact

**前端**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：`addIssueToStore` 方法需添加 `extra_properties` 字段

**上游影响评估**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：上游核心文件，有持续维护（中等风险）
