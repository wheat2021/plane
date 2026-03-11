## Why

工作项类型（IssueType）目前只能通过数据库迁移创建，无法在 UI 中管理。工作区管理员无法自行创建符合业务需求的自定义类型，也无法调整现有类型的图标和颜色，严重限制了平台的灵活性。

## What Changes

- **新增**工作区设置中的「Work Item Types」管理页（`/settings/work-item-types`），仅 Workspace Admin 可访问
- **新增**工作项类型的完整 CRUD 操作：创建、查看、编辑（名称/说明/图标/颜色）、删除
- **新增** `is_system` 字段区分系统内置类型与自定义类型，系统类型不可改名也不可删除
- **新增**后端 POST/PATCH/DELETE 接口（`/api/workspaces/{slug}/issue-types/`）
- **新增**图标选择器：基于现有 `CustomSearchSelect`，从 `lucide-react` 包提供可搜索的图标选择，配合预设色板 + HEX 输入的颜色选择器
- **新增**类型拖拽排序（写入 `level` 字段）
- **新增**删除时的全局级联迁移：将所有项目中该类型的工作项迁移至各项目默认类型，再软删除（`is_active=False`）
- **修改**前端 `getIssueTypeIcon` 函数，实际读取 `logo_props` 渲染图标，而非依赖类型名硬编码
- **新增** i18n key：`workspace_settings.settings.work_item_types.*`（所有 20 种语言）

## Capabilities

### New Capabilities

- `workspace-work-item-types-crud`：工作区管理员对工作项类型的增删改查，包括图标/颜色/说明编辑、系统类型保护、拖拽排序

### Modified Capabilities

- `work-item-types`：新增工作区管理入口和 `is_system` 字段，现有 project settings 页行为不变

## Impact

**后端（apps/api/）**

- `plane/db/models/issue_type.py`：新增 `is_system` 字段
- `plane/app/views/workspace/issue_type.py`：新增 POST/PATCH/DELETE handler
- `plane/app/serializers/issue_type.py`：暴露 `is_system` 字段
- `plane/db/migrations/`：新增 migration（添加字段 + 回填系统类型标记）

**前端（apps/web/）**

- 新增页面：`app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/work-item-types/`
- 新增组件目录：`core/components/workspace/settings/work-item-types/`
- 修改：`core/components/dropdowns/issue-type-icon.tsx`（实际读取 logo_props）
- 修改：`core/store/issue-type.store.ts`（新增 CRUD actions）
- 修改：`core/services/issue-type.service.ts`（新增 API 方法）
- 修改：`packages/constants/src/settings/workspace.ts`（注册新侧边栏入口）
- 修改：`packages/types/src/issue-type.ts`（新增 `is_system` 字段）
- 修改：`packages/i18n/src/locales/*/translations.ts`（所有语言新增 key）

**上游冲突风险**

- `packages/types/src/issue-type.ts`：低风险（自定义扩展字段）
- `packages/i18n/src/locales/en/translations.ts`：中风险（可能与上游 key 冲突）
- `core/components/dropdowns/issue-type-icon.tsx`：低风险（自定义文件）
