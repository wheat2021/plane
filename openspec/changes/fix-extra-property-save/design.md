## 问题分析

### 根因

`apps/web/core/store/issue/issue-details/issue.store.ts` 中的 `addIssueToStore` 方法使用显式字段映射构建 `issuePayload` 对象，但遗漏了 `extra_properties` 字段：

```typescript
addIssueToStore = (issue: TIssue) => {
  const issuePayload: TIssue = {
    id: issue?.id,
    // ... 所有其他字段 ...
    type_id: issue?.type_id,
    // ❌ 缺少 extra_properties
    created_at: issue?.created_at,
    // ...
  };
};
```

### 影响范围

该方法在两处被调用：
1. `fetchIssue` — 打开工作项详情时
2. `fetchIssueWithIdentifier` — 通过标识符打开工作项时

所有通过详情页加载的工作项都会丢失 `extra_properties`，影响全部 Extra Property 类型。

## 修复方案

在 `addIssueToStore` 的 `issuePayload` 对象中添加 `extra_properties` 字段映射：

```typescript
extra_properties: issue?.extra_properties,
```

位置：在 `type_id` 之后、`created_at` 之前。
