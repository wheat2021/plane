## Why

用户在工作项详情页修改 Extra Property（如 Severity）后，值无法持久保存——刷新页面后恢复为默认值。经代码分析和数据库验证，API PATCH 成功将数据写入数据库，但多处读取链路遗漏了 `extra_properties` 字段。

根因是多处代码使用显式字段列表但遗漏了 `extra_properties`：

1. **`issue_on_results`**（`apps/api/plane/utils/grouper.py`）：列表视图分页查询的核心字段列表，所有带 `group_by` 的列表请求都经过此函数
2. **前端 `addIssueToStore`**（`issue-details/issue.store.ts`）：详情页加载时的字段映射
3. **`IssueListDetailSerializer.to_representation`**（`serializers/issue.py`）：`/issues-detail/` 接口
4. **`IssueViewSet.list` 的 `.values()`**（`views/issue/base.py`）：无 group_by 时的列表接口
5. **`IssueViewSet.create` 的 `.values()`**（`views/issue/base.py`）：创建后返回的字段
6. **`IssuePaginatedViewSet.list` 的 `required_fields`**（`views/issue/base.py`）：v2 分页接口

其中 #1 是主要原因——前端列表视图默认带 `group_by` 参数，所有请求都走 `issue_on_results`。

## What Changes

- 在上述 6 处字段列表中补充 `extra_properties`

## Capabilities

### Modified Capabilities

（无 spec 级别的行为变更，仅修复已有功能的数据丢失 bug）

## Impact

**前端**
- `apps/web/core/store/issue/issue-details/issue.store.ts`

**后端**
- `apps/api/plane/utils/grouper.py`（核心修复）
- `apps/api/plane/app/serializers/issue.py`
- `apps/api/plane/app/views/issue/base.py`

**上游影响评估**
- `grouper.py`：上游核心工具（中等风险）
- `issue.store.ts`：上游核心文件（中等风险）
- `serializers/issue.py`：上游核心文件（中等风险）
- `views/issue/base.py`：上游核心文件（中等风险）
