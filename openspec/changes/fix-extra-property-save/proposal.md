## Why

用户在工作项详情页修改 Extra Property（如 Severity）后，值无法持久保存——刷新页面后恢复为旧值（default_value）。经代码分析和数据库验证，API PATCH 成功将数据写入数据库，但多处读取链路遗漏了 `extra_properties` 字段。

根因共四处遗漏：

1. **前端 `addIssueToStore`**：显式映射字段时遗漏 `extra_properties` → 详情页加载后 store 丢失
2. **后端 `IssueListDetailSerializer.to_representation`**：显式列举字段时遗漏 → `/issues-detail/` 接口不返回
3. **后端 `IssueViewSet.list` 的 `.values()`**：显式列举字段时遗漏 → `/issues/` 接口不返回
4. **后端 `IssuePaginatedViewSet.list` 的 `required_fields`**：显式列举字段时遗漏 → `/v2/issues/` 接口不返回

由于列表 API 不返回 `extra_properties`，store 中该字段为 `undefined`，前端 fallback 到 `config.default_value`（如 `medium`），导致用户看到的始终是默认值。

这是一个共性问题，影响所有 Extra Property 类型。

## What Changes

- 在前端 `addIssueToStore` 方法中补充 `extra_properties` 字段映射
- 在后端三处列表接口的字段列表中补充 `extra_properties`

## Capabilities

### Modified Capabilities

（无 spec 级别的行为变更，仅修复已有功能的数据丢失 bug）

## Impact

**前端**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：`addIssueToStore` 方法

**后端**

- `apps/api/plane/app/serializers/issue.py`：`IssueListDetailSerializer.to_representation`
- `apps/api/plane/app/views/issue/base.py`：`IssueViewSet.list` 的 `.values()` 和 `IssuePaginatedViewSet.list` 的 `required_fields`

**上游影响评估**

- `apps/web/core/store/issue/issue-details/issue.store.ts`：上游核心文件（中等风险）
- `apps/api/plane/app/serializers/issue.py`：上游核心文件（中等风险）
- `apps/api/plane/app/views/issue/base.py`：上游核心文件（中等风险）
