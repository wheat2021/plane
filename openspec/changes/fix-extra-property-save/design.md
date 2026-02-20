## 问题分析

### 根因

`extra_properties` 字段在四处代码中被遗漏，导致读取链路断裂：

1. **前端 `addIssueToStore`**（`issue-details/issue.store.ts`）：显式映射字段时遗漏
2. **后端 `IssueListDetailSerializer`**（`serializers/issue.py`）：`to_representation` 显式列举时遗漏
3. **后端 `IssueViewSet.list`**（`views/issue/base.py`）：`.values()` 显式列举时遗漏
4. **后端 `IssuePaginatedViewSet.list`**（`views/issue/base.py`）：`required_fields` 显式列举时遗漏

### 表现

- API PATCH 成功保存到数据库（已通过 raw SQL 验证）
- 列表 API 不返回 `extra_properties` → store 中为 `undefined`
- 前端 fallback 到 `config.default_value`（如 `medium`）→ 用户看到默认值
- 打开详情页后 `fetchIssue` 返回正确值并更新 store → 关闭详情后列表显示正确

## 修复方案

在四处遗漏位置各添加一行 `extra_properties` 字段。
