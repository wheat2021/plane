## 问题分析

### 根因

`extra_properties` 字段在多处显式字段列表中被遗漏，导致读取链路断裂：

| 位置 | 文件 | 影响 |
|---|---|---|
| `issue_on_results` required_fields | `apps/api/plane/utils/grouper.py` | 所有带 group_by 的列表请求（主要原因） |
| `addIssueToStore` issuePayload | `apps/web/.../issue-details/issue.store.ts` | 详情页加载 |
| `IssueListDetailSerializer` to_representation | `apps/api/.../serializers/issue.py` | `/issues-detail/` 接口 |
| `IssueViewSet.list` .values() | `apps/api/.../views/issue/base.py` | 无 group_by 的列表 |
| `IssueViewSet.create` .values() | 同上 | 创建后返回 |
| `IssuePaginatedViewSet` required_fields | 同上 | `/v2/issues/` 接口 |

此外，展示组件错误地将 `config.default_value` 作为未设置时的 fallback 显示值。

### 表现

- API PATCH 成功保存到数据库
- 列表 API 不返回 `extra_properties` → store 中为 `undefined` → fallback 到 `default_value`
- 用户看到的始终是默认值（如 Medium），而非实际保存的值

## 修复方案

1. 在 6 处后端/前端字段列表中添加 `extra_properties`
2. 在 3 处展示组件中将 `?? config.default_value ?? null` 改为 `?? null`
