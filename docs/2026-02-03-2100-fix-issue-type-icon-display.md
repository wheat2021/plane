# 修复 Work Item Type 图标显示问题

**日期**: 2026-02-03 21:00 - 23:30
**类型**: 🔴 Bug修复

## 问题描述

刷新页面后，work item 列表中没有显示对应 work item type 的图标，只有当点击某个 work item 后，对应的图标才会显示。

## 根本原因分析

经过深入调查，发现了两个导致图标不显示的问题：

### 主要问题：后端序列化器遗漏 type_id 字段

**文件**：`apps/api/plane/app/serializers/issue.py`

`IssueListDetailSerializer` 的 `to_representation()` 方法手动构建 API 响应数据，但**遗漏了 `type_id` 字段**。这导致：

1. API 返回的 issues 数据中没有 `type_id`
2. 前端无法获取 issue 的类型信息
3. `IssueTypeIconDisplay` 组件因为 `getIssueTypeById(null)` 返回 `undefined` 而不渲染图标

**验证方法**：

```bash
# 数据库中有 type_id
docker exec plane-db psql -U plane -d plane -c \
  "SELECT id, sequence_id, type_id FROM issues LIMIT 3;"

# 但 API 返回的数据中没有 type_id
curl http://localhost/api/workspaces/{workspace}/projects/{project}/issues/ | jq '.results[0].type_id'
# 返回: null
```

### 次要问题：前端未预加载 issue types 数据

**文件**：`apps/web/core/layouts/auth-layout/workspace-wrapper.tsx`

`WorkspaceAuthWrapper` 组件负责预加载 workspace 级别的数据（members, states, projects等），但缺少 issue types 的预加载。

虽然前端组件（`IssueTypeDropdown`）在使用时会按需加载 issue types，但列表视图初始渲染时如果 store 中没有数据，会导致图标不显示。

## 解决方案

### 1. 后端修复：在序列化器中添加 type_id 字段

**文件**: `apps/api/plane/app/serializers/issue.py`

在 `IssueListDetailSerializer.to_representation()` 方法中添加 `type_id` 字段：

```python
def to_representation(self, instance):
    data = {
        # ... 其他字段 ...
        "sequence_id": instance.sequence_id,
        "project_id": instance.project_id,
        "parent_id": instance.parent_id,
        "type_id": instance.type_id,  # 添加此行
        "created_at": instance.created_at,
        # ... 其他字段 ...
    }
```

**位置**：第 862 行

### 2. 前端优化：预加载 issue types 数据

#### 添加 Fetch Key 常量

**文件**: `apps/web/core/constants/fetch-keys.ts`

```typescript
export const WORKSPACE_ISSUE_TYPES = (workspaceSlug: string) => `WORKSPACE_ISSUE_TYPES_${workspaceSlug.toUpperCase()}`;
```

#### 在 WorkspaceAuthWrapper 中预加载

**文件**: `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx`

**导入**:

```typescript
import { useIssueType } from "@/hooks/store/use-issue-type";
import { WORKSPACE_ISSUE_TYPES } from "@/constants/fetch-keys";
```

**获取 hook**:

```typescript
const { fetchWorkspaceIssueTypes } = useIssueType();
```

**添加 SWR 预加载**:

```typescript
// fetch workspace issue types
useSWR(
  workspaceSlug ? WORKSPACE_ISSUE_TYPES(workspaceSlug.toString()) : null,
  workspaceSlug ? () => fetchWorkspaceIssueTypes(workspaceSlug.toString()) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

## 部署步骤

### 后端部署（必须）

```bash
# 重新构建 API 镜像
docker compose -f docker-compose-local.yml build api

# 重启 API 服务
docker compose restart api
```

### 前端部署（可选优化）

```bash
# 重新构建 web 镜像
docker compose build web

# 重启 web 服务
docker compose restart web
```

**注意**：前端修改是性能优化，不是必须的。即使不部署前端修改，只要部署了后端修改，图标也能正常显示（因为 `IssueTypeDropdown` 会按需加载数据）。

## 验证步骤

### 1. 验证 API 返回 type_id

```bash
# 方法 1：使用 curl
curl -H "Cookie: your-session-cookie" \
  http://localhost/api/workspaces/ficc/projects/{project-id}/issues/ \
  | jq '.results[0] | {id, sequence_id, name, type_id}'

# 方法 2：在浏览器控制台
fetch('/api/workspaces/ficc/projects/{project-id}/issues/?order_by=-created_at')
  .then(r => r.json())
  .then(data => console.log(data.results[0].type_id))
// 应该返回一个 UUID，不是 null
```

### 2. 验证页面显示

1. 打开浏览器访问 work items 列表页面
2. 刷新页面（F5）
3. 确认列表中的 issue type 图标立即显示
4. 不需要先点击 issue

## 技术细节

### 为什么需要修改两个序列化器？

Plane 使用了两个不同的序列化器：

1. **IssueSerializer** (`DynamicBaseSerializer`)
   - 用于单个 issue 的详情视图
   - 使用 Django REST framework 的标准序列化
   - `type_id` 字段已正确定义在 `fields` 列表中

2. **IssueListDetailSerializer**
   - 用于 issues 列表视图
   - 手动构建响应以优化性能
   - **之前遗漏了 `type_id` 字段**

### 数据流

修复后的数据流：

```
页面加载
  ↓
WorkspaceAuthWrapper 预加载 issue types
  ↓
IssueTypeStore.issueTypeMap 填充数据
  ↓
API 返回 issues 列表（包含 type_id）
  ↓
IssueBlock 组件渲染
  ↓
IssueIdentifier 组件（传入 issue.type_id）
  ↓
IssueTypeIconDisplay 组件
  ↓
getIssueTypeById(type_id) 从 store 获取数据
  ↓
渲染图标
```

## 相关文件

### 后端

- `apps/api/plane/app/serializers/issue.py` - 添加 type_id 到响应

### 前端

- `apps/web/core/constants/fetch-keys.ts` - 添加 WORKSPACE_ISSUE_TYPES 常量
- `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx` - 预加载 issue types
- `apps/web/core/store/issue-type.store.ts` - Issue Type 数据存储
- `apps/web/ce/components/issues/issue-details/issue-identifier.tsx` - 图标显示组件

## 开发日志

### 2026-02-03 21:00 - 问题分析

- 通过代码审查确定了图标显示依赖于 IssueTypeStore 中的数据
- 发现 issue types 数据只在特定组件中按需加载
- 确认需要在页面初始化时预加载数据

### 2026-02-03 21:15 - 首次尝试修复

- 添加 WORKSPACE_ISSUE_TYPES fetch key
- 在 WorkspaceAuthWrapper 中添加 useSWR 预加载
- 重新构建并重启 web 服务

### 2026-02-03 22:00 - 发现真正问题

- 验证时发现即使预加载了 issue types，图标仍不显示
- 使用浏览器检查 API 响应，发现 `type_id` 字段为 `null`
- 查询数据库确认数据库中有 `type_id` 值
- **定位到问题根源**：`IssueListDetailSerializer` 未包含 `type_id`

### 2026-02-03 22:30 - 修复后端问题

- 在 `IssueListDetailSerializer.to_representation()` 中添加 `type_id`
- 需要重新构建 API 镜像以应用修改
- 因网络下载慢，构建过程较长

## 总结

这个 bug 的主要原因是后端序列化器遗漏了字段，而不是前端预加载的问题。修复需要：

- ✅ **必须修复**：后端添加 `type_id` 到 API 响应
- ✅ **性能优化**：前端预加载 issue types 数据（可选）

后端修复后，即使不部署前端修改，功能也能正常工作，因为前端组件会在需要时自动加载 issue types 数据。前端预加载只是避免了初始加载时的额外 API 请求。

## 后续改进建议

1. **添加测试**：为 `IssueListDetailSerializer` 添加单元测试，确保所有必要字段都包含在响应中
2. **代码审查**：检查其他序列化器是否有类似遗漏
3. **类型安全**：在前端使用 TypeScript 严格模式，确保 API 响应类型与实际数据匹配
