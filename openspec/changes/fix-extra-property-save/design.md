## 问题分析

### 根因

存在两处代码遗漏 `extra_properties` 字段：

1. **前端 `addIssueToStore`**：`apps/web/core/store/issue/issue-details/issue.store.ts` 中显式映射 issue 字段时遗漏了 `extra_properties`，导致通过详情页 `fetchIssue` 加载工作项时该字段被丢弃。

2. **后端 `IssueListDetailSerializer`**：`apps/api/plane/app/serializers/issue.py` 中 `to_representation` 显式列举返回字段时遗漏了 `extra_properties`，导致列表接口不返回该字段，首次从列表加载的 issue 在 store 中没有 `extra_properties`。

### 影响范围

- 所有 Extra Property 类型（text、select、multiselect、checkbox、markdown）均受影响
- 列表视图和详情视图都会丢失 extra_properties 数据
- API PATCH 保存到数据库是成功的，但前端无法正确读取

## 修复方案

1. 在 `addIssueToStore` 的 `issuePayload` 中添加 `extra_properties: issue?.extra_properties`
2. 在 `IssueListDetailSerializer.to_representation` 的 data dict 中添加 `"extra_properties": instance.extra_properties`
