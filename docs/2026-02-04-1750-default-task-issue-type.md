# 修改 Work Item 默认类型为 Task 并添加灰色图标

## Objective

修改 work item 的默认类型为 Task，为其设置灰色 circle-check 图标，使得 work item list 中每个 work item 都有图标显示（包括没有设置 type 的 item）。

## Approach

### 需求分析

1. **用户选择**：
   - 对于没有 type_id 的现有 work items：前端显示默认图标（不修改数据库）
   - Task 类型图标：使用 circle-check（圆圈打勾图标）

2. **实现方案**：
   - 后端：创建数据库迁移，添加 Task 类型作为默认类型
   - 前端：修改图标渲染逻辑，当 type_id 为空时显示默认灰色图标

### 技术方案

**后端修改**：

- 创建迁移文件 `0119_add_task_issue_type.py`
- 为所有 workspace 添加 Task 类型（灰色 #6b7280 + circle-check 图标）
- 将 Task 设为默认类型（is_default=True），原 Requirement 改为非默认

**前端修改**：

- `issue-type-icon.tsx`：添加 task 类型支持，导出默认图标函数
- `issue-identifier.tsx`：修改多处组件，当 type_id 为空时显示默认灰色图标

## Development Log

### 2026-02-04 17:30 - 需求确认

与用户确认两个关键问题：

1. 没有 type_id 的 work items 处理方式 → 用户选择"前端显示默认图标"
2. Task 类型图标选择 → 用户选择"circle-check (推荐)"

### 2026-02-04 17:35 - 后端实现

创建数据库迁移文件 `apps/api/plane/db/migrations/0119_add_task_issue_type.py`：

```python
# 核心逻辑
IssueType.objects.create(
    id=uuid.uuid4(),
    workspace=workspace,
    name="Task",
    description="A task or action item to be completed",
    logo_props={
        "in_use": "icon",
        "icon": {"name": "circle-check", "color": "#6b7280"}
    },
    is_default=True,
    is_active=True,
    level=-1,  # 排在 Requirement 前面
)
```

### 2026-02-04 17:40 - 前端实现

**修改 1**: `apps/web/core/components/dropdowns/issue-type-icon.tsx`

- 添加 `CircleCheck` 图标导入
- 导出 `DEFAULT_ISSUE_TYPE_COLOR = "#6b7280"`
- 添加 `task` case 使用 CircleCheck 图标
- 将 default case 改为 CircleCheck（原为 FileText）
- 新增 `getDefaultIssueTypeIcon()` 函数

**修改 2**: `apps/web/ce/components/issues/issue-details/issue-identifier.tsx`

修改三处组件逻辑：

1. `IssueIdentifier` 组件：

   ```tsx
   {
     shouldRenderIssueType &&
       (issueTypeId ? (
         <IssueTypeIconDisplay issueTypeId={issueTypeId} size={size} />
       ) : (
         <span className="flex-shrink-0">{getDefaultIssueTypeIcon(iconSize)}</span>
       ));
   }
   ```

2. `IssueTypeIdentifier` 只读模式：

   ```tsx
   {
     issueType
       ? getIssueTypeIcon(issueType.name, issueType.logo_props?.icon?.color, iconSize)
       : getDefaultIssueTypeIcon(iconSize);
   }
   ```

3. `IssueTypeIdentifier` 下拉按钮：
   ```tsx
   {
     issueType
       ? getIssueTypeIcon(issueType.name, issueType.logo_props?.icon?.color, iconSize)
       : getDefaultIssueTypeIcon(iconSize);
   }
   ```

### 2026-02-04 17:45 - 执行迁移

```bash
docker compose -f compose.dev.yml exec api python manage.py migrate
# 输出: Applying db.0119_add_task_issue_type... OK
```

### 2026-02-04 17:50 - 启动验证

遇到 `@plane/utils` 和 `@plane/constants` 包未构建问题，通过以下步骤解决：

```bash
# 清除 turbo 缓存
rm -rf .turbo node_modules/.cache/turbo

# 重新构建所有包
pnpm build

# 启动 web 开发服务器
pnpm --filter=web run dev
```

服务器成功启动，返回 HTTP 200。

## Summary

### 修改文件列表

| 文件                                                               | 修改类型 | 说明                         |
| ------------------------------------------------------------------ | -------- | ---------------------------- |
| `apps/api/plane/db/migrations/0119_add_task_issue_type.py`         | 新增     | 添加 Task 类型并设为默认     |
| `apps/web/core/components/dropdowns/issue-type-icon.tsx`           | 修改     | 添加 task 支持和默认图标函数 |
| `apps/web/ce/components/issues/issue-details/issue-identifier.tsx` | 修改     | 三处组件支持显示默认图标     |

### 效果

- 所有 workspace 自动获得 Task 类型（灰色 circle-check 图标）
- Task 类型成为默认类型
- Work item 列表中所有 item 都显示图标：
  - 有 type 的显示对应类型图标
  - 没有 type 的显示灰色 circle-check 默认图标

### 验证方式

访问 http://localhost:3000，在 work item 列表中查看：

1. 新建的 issue 默认使用 Task 类型
2. 没有设置 type 的旧 issue 显示灰色默认图标
