## Why

用户在工作项详情页修改 Extra Property（如 Severity）后，值无法持久保存——刷新页面后恢复为默认值。经代码分析和数据库验证，API PATCH 成功将数据写入数据库，但多处读取链路遗漏了 `extra_properties` 字段。

此外，未设置 Extra Property 的工作项错误地显示 `default_value`（如 Medium），而 `default_value` 的用途应仅限于创建时预填充。

### 根因

多处代码使用显式字段列表但遗漏了 `extra_properties`：

1. **`issue_on_results`**（`apps/api/plane/utils/grouper.py`）：列表视图分页查询的核心字段列表（主要原因）
2. **前端 `addIssueToStore`**（`issue-details/issue.store.ts`）：详情页加载时的字段映射
3. **`IssueListDetailSerializer.to_representation`**（`serializers/issue.py`）：`/issues-detail/` 接口
4. **`IssueViewSet.list` / `create` 的 `.values()`**（`views/issue/base.py`）：列表和创建接口
5. **`IssuePaginatedViewSet.list` 的 `required_fields`**（`views/issue/base.py`）：v2 分页接口

展示场景错误使用 `default_value` 作为 fallback：
- `extra-property-renderer.tsx`、`additional-properties.tsx`、`issue-row.tsx` 三处

## What Changes

- 在上述 5 处后端/前端字段列表中补充 `extra_properties`
- 在 3 处展示场景中移除 `config.default_value` fallback，未设置时显示为空

## Capabilities

### Modified Capabilities

（无 spec 级别的行为变更，仅修复已有功能的 bug）

## Impact

**前端**
- `apps/web/core/store/issue/issue-details/issue.store.ts`
- `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`
- `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`
- `apps/web/core/components/issues/issue-layouts/spreadsheet/issue-row.tsx`

**后端**
- `apps/api/plane/utils/grouper.py`
- `apps/api/plane/app/serializers/issue.py`
- `apps/api/plane/app/views/issue/base.py`

**上游影响评估**
- `grouper.py`：上游核心工具（中等风险）
- `issue.store.ts`：上游核心文件（中等风险）
- `serializers/issue.py`：上游核心文件（中等风险）
- `views/issue/base.py`：上游核心文件（中等风险）
- `extra-property-renderer.tsx`、`additional-properties.tsx`、`issue-row.tsx`：我方新增文件（低风险）
