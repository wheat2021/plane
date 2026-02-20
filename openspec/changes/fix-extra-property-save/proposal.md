## Why

用户在工作项详情页修改 Extra Property（如 Severity）后，值无法持久保存——刷新页面后恢复为旧值。经代码分析和数据库验证，API PATCH 成功将数据写入数据库，但前端无法正确读取。根因有两处：

1. **前端 `addIssueToStore`** 在将 API 返回的 issue 数据映射到 store 时，显式列举了所有字段但遗漏了 `extra_properties`，导致详情页加载时该字段被丢弃
2. **后端 `IssueListDetailSerializer`** 的 `to_representation` 显式列举返回字段时也遗漏了 `extra_properties`，导致列表接口不返回该字段

这是一个共性问题，影响所有 Extra Property 类型（text、select、multiselect、checkbox 等），不仅限于 Severity。

## What Changes

- 在前端 `addIssueToStore` 方法中补充 `extra_properties` 字段映射
- 在后端 `IssueListDetailSerializer.to_representation` 中补充 `extra_properties` 字段

## Capabilities

### Modified Capabilities

（无 spec 级别的行为变更，仅修复已有功能的数据丢失 bug）

## Impact

**前端**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：`addIssueToStore` 方法需添加 `extra_properties` 字段

**后端**

- `apps/api/plane/app/serializers/issue.py`：`IssueListDetailSerializer.to_representation` 需添加 `extra_properties` 字段

**上游影响评估**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：上游核心文件，有持续维护（中等风险）
- `apps/api/plane/app/serializers/issue.py`：上游核心文件，有持续维护（中等风险）
