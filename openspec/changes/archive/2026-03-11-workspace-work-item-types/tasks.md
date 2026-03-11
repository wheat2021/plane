## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）到代码库

## 2. 后端数据模型与 Migration

- [x] 2.1 确认当前最新 migration 序号，确定新 migration 文件名
- [x] 2.2 在 `IssueType` 模型中新增 `is_system = BooleanField(default=False)` 字段
- [x] 2.3 在 `IssueTypeSerializer` 中暴露 `is_system` 字段（read_only）
- [x] 2.4 创建 migration：添加 `is_system` 字段
- [x] 2.5 创建 migration：回填内置类型 `is_system=True`（Task、Bug、Story、Requirement、Milestone、Report）

## 3. 后端 API 接口

- [x] 3.1 在 `WorkspaceIssueTypesEndpoint` 新增 `post` 方法（创建自定义类型，ADMIN 权限）
- [x] 3.2 新建 `WorkspaceIssueTypeDetailEndpoint`，实现 `patch` 方法（编辑类型，ADMIN 权限，系统类型 name 只读）
- [x] 3.3 在 `WorkspaceIssueTypeDetailEndpoint` 实现 `delete` 方法（软删除 + 全局级联迁移，ADMIN 权限，系统类型拒绝删除）
- [x] 3.4 新建删除用的 `get_usage_summary` 辅助方法或接口，返回受影响项目数和工作项数（供前端确认弹窗展示）
- [x] 3.5 注册新路由：`workspaces/<str:slug>/issue-types/<uuid:pk>/` → `WorkspaceIssueTypeDetailEndpoint`
- [x] 3.6 在 `patch` 中校验：`is_system=True` 时忽略 `name` 字段修改
- [x] 3.7 在 `delete` 中校验：若某项目只启用该类型，返回 400 并携带项目列表

## 4. 前端类型定义与 Service

- [x] 4.1 在 `packages/types/src/issue-type.ts` 中为 `TIssueType` 新增 `is_system: boolean` 字段 [UPSTREAM-RISK: 低]
- [x] 4.2 在 `apps/web/core/services/issue-type.service.ts` 中新增 `createWorkspaceIssueType`、`updateWorkspaceIssueType`、`deleteWorkspaceIssueType`、`getWorkspaceIssueTypeUsage` 方法

## 5. 前端 Store

- [x] 5.1 在 `IIssueTypeStore` 接口中新增 `createWorkspaceIssueType`、`updateWorkspaceIssueType`、`deleteWorkspaceIssueType` 声明
- [x] 5.2 在 `IssueTypeStore` 中实现 `createWorkspaceIssueType`（调用 service，runInAction 更新 issueTypeMap）
- [x] 5.3 在 `IssueTypeStore` 中实现 `updateWorkspaceIssueType`（调用 service，runInAction 更新对应 issueTypeMap 条目）
- [x] 5.4 在 `IssueTypeStore` 中实现 `deleteWorkspaceIssueType`（调用 service，runInAction 将 is_active 设 false 或从 map 移除）

## 6. 前端图标渲染修复

- [x] 6.1 修改 `apps/web/core/components/dropdowns/issue-type-icon.tsx`：优先从 `logo_props.icon` 读取 Lucide 图标名和颜色，当 logo_props 为空时回退到按名称硬编码

## 7. 前端图标/颜色选择器组件

- [x] 7.1 新建 `LucideIconPicker` 组件（基于 `CustomSearchSelect`）：空 query 时显示提示，有 query 时过滤渲染 Lucide 图标选项
- [x] 7.2 构建 Lucide 图标静态列表常量（从 `lucide-react` 导出名自动生成 kebab-case 数组），用于选项数据
- [x] 7.3 新建 `IconColorPicker` 组合组件：整合 `LucideIconPicker` + 预设 12 色色板 + HEX 输入框

## 8. 工作区设置 Work Item Types 管理页组件

- [x] 8.1 新建组件目录 `apps/web/core/components/workspace/settings/work-item-types/`
- [x] 8.2 实现 `type-list.tsx`：展示类型列表，支持拖拽排序（复用 Sortable 基础设施）
- [x] 8.3 实现 `type-item.tsx`：单个类型行，含图标、名称、说明、系统类型 badge、编辑/删除按钮、拖拽手柄
- [x] 8.4 实现 `type-form.tsx`：内联创建/编辑表单，含 `LucideIconPicker`、颜色选择器、名称输入、说明输入
- [x] 8.5 实现 `delete-modal.tsx`：删除确认弹窗，调用 usage summary 接口展示影响摘要
- [x] 8.6 实现 `root.tsx`：主容器，useSWR 加载数据，集成列表和新建按钮
- [x] 8.7 更新 `index.ts` 导出

## 9. 工作区设置页面路由与侧边栏

- [x] 9.1 新建 `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/work-item-types/page.tsx`
- [x] 9.2 新建对应 `header.tsx`
- [x] 9.3 在 `packages/constants/src/settings/workspace.ts` 中新增 `work-item-types` 入口（FEATURES 类别，ADMIN 权限） [UPSTREAM-RISK: 低]
- [x] 9.4 在 `WorkspaceSettingsSidebarItemCategories` 的图标映射中添加 `work-item-types` 对应图标

## 10. 国际化

- [x] 10.1 在 `packages/i18n/src/locales/en/translations.ts` 的 `workspace_settings.settings` 下新增 `work_item_types` key 段（含页面标题、按钮文本、表单标签、错误提示、toast 消息等） [UPSTREAM-RISK: 中]
- [x] 10.2 为其他所有语言（zh-CN、zh-TW、ja、ko 等共 19 种语言）同步新增相同 key 段（可先用英文占位）

## 11. 项目设置页改动

- [x] 11.1 修改 `work-item-type-item.tsx`：系统类型显示 badge（`is_system=True` 时渲染标记）
- [x] 11.2 确认图标渲染已通过步骤 6.1 修复，项目设置页无需额外修改

## 12. 提交实现代码

- [x] 12.1 提交后端变更：`#FICC-9999# feat: 新增 is_system 字段及工作项类型 CRUD API`
- [x] 12.2 提交前端基础设施变更：`#FICC-9999# feat: 新增 Lucide 图标选择器和颜色选择器组件`
- [x] 12.3 提交 Store/Service 变更：`#FICC-9999# feat: 新增工作项类型 CRUD store 和 service 方法`
- [x] 12.4 提交图标渲染修复：`#FICC-9999# fix: 工作项类型图标从 logo_props 动态读取`
- [x] 12.5 提交工作区设置管理页：`#FICC-9999# feat: 新增工作区工作项类型管理页`
- [x] 12.6 提交 i18n 变更：`#FICC-9999# feat: 新增工作项类型管理页多语言支持`

## 13. 用户验证

- [x] 13.1 验证：以 Workspace Admin 身份访问工作区设置，侧边栏「Work Item Types」入口可见并可点击 ✅ 2026-03-10
- [x] 13.2 验证：创建新类型（填写名称、选择图标和颜色），类型出现在列表末尾，图标颜色正确显示 ✅ 2026-03-10
- [x] 13.3 验证：编辑系统类型（如 Bug），可修改图标和颜色，名称字段为只读，保存后全局同步更新 ✅ 2026-03-11
- [x] 13.4 验证：编辑自定义类型，可修改所有字段 ✅ 2026-03-10
- [x] 13.5 验证：删除自定义类型前弹窗正确展示影响项目数和工作项数，确认后工作项正确迁移到默认类型 ✅ 2026-03-11
- [x] 13.6 验证：系统类型（Task/Bug 等）无删除按钮 ✅ 2026-03-10
- [x] 13.7 验证：拖拽排序后刷新页面顺序持久化 ✅ 2026-03-11
- [x] 13.8 验证：图标搜索在 query 为空时不渲染列表，输入关键词后正确过滤显示 ✅ 2026-03-11
- [x] 13.9 验证：非 Workspace Admin 用户无法访问 `/settings/work-item-types` 路由 ✅ 2026-03-11
- [x] 13.10 验证：项目设置页工作项类型的图标正确从 `logo_props` 读取（不再是硬编码） ✅ 2026-03-11
- [x] 13.11 验证：项目设置页系统类型显示 badge 标记 ✅ 2026-03-11
